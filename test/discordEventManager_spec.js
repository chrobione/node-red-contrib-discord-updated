const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');

const discordEventManager = require('../discord/discordEventManager');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');
const discordFramework = require('../discord/lib/discordFramework');
const {
  ChannelType,
  GuildScheduledEventEntityType,
} = require('discord.js');

helper.init(require.resolve('node-red'));

describe('Discord Event Manager Node', function () {
  let getBotStub;
  let getEventManagerStub;
  let getChannelStub;
  let eventManager;

  beforeEach(function () {
    eventManager = { create: sinon.stub() };
    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves({});
    getEventManagerStub = sinon.stub(discordFramework, 'getEventManager').resolves(eventManager);
    getChannelStub = sinon.stub(discordFramework, 'getChannel');
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('creates a stage scheduled event when channel is stage voice', function (done) {
    const start = new Date().toISOString();
    eventManager.create.resolves({ id: 'evt123' });
    getChannelStub.resolves({ id: 'stage123', type: ChannelType.GuildStageVoice });

    const flow = [
      { id: 'n1', type: 'discordEventManager', name: 'events', token: 'tok', wires: [['n2']] },
      { id: 'tok', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordEventManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.on('input', function (msg) {
        try {
          sinon.assert.calledOnce(eventManager.create);
          const payload = eventManager.create.firstCall.args[0];
          payload.entityType.should.equal(GuildScheduledEventEntityType.StageInstance);
          payload.channel.should.equal('stage123');
          payload.scheduledStartTime.should.be.instanceOf(Date);
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({
        action: 'create',
        guild: 'guild123',
        eventName: 'Town Hall',
        scheduledStartTime: start,
        channel: 'stage123',
        eventType: 'stage',
        description: 'Discuss updates',
      });
    });
  });

  it('errors when stage event channel is not a stage channel', function (done) {
    const start = new Date().toISOString();
    eventManager.create.resolves({ id: 'evt123' });
    getChannelStub.resolves({ id: 'voice123', type: ChannelType.GuildVoice });

    const flow = [
      { id: 'n1', type: 'discordEventManager', name: 'events', token: 'tok', wires: [['n2']] },
      { id: 'tok', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordEventManager], flow, function () {
      const node = helper.getNode('n1');

      node.once('call:error', call => {
        try {
          const err = call.args[0];
          err.should.be.instanceOf(Error);
          err.message.should.equal('msg.channel must reference a stage channel when event type is set to stage');
          sinon.assert.notCalled(eventManager.create);
          done();
        } catch (assertErr) {
          done(assertErr);
        }
      });

      node.receive({
        action: 'create',
        guild: 'guild123',
        eventName: 'Town Hall',
        scheduledStartTime: start,
        channel: 'voice123',
        eventType: 'stage',
      });
    });
  });
});
