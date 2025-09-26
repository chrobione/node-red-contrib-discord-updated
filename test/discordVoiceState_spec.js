const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');

const discordVoiceState = require('../discord/discordVoiceState');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');

helper.init(require.resolve('node-red'));

describe('discordVoiceState Node', function () {
  let getBotStub;
  let bot;

  beforeEach(function () {
    bot = {
      on: sinon.stub(),
      removeListener: sinon.stub(),
    };
    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves(bot);
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('emits join and leave events', function (done) {
    const flow = [
      { id: 'n1', type: 'discordVoiceState', name: 'voice', token: 't1', wires: [['n2']] },
      { id: 't1', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordVoiceState], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      const listeners = bot.on.getCalls().filter(call => call.args[0] === 'voiceStateUpdate');
      listeners.should.have.length(1);
      const handler = listeners[0].args[1];

      const outputs = [];
      helperNode.on('input', function (msg) {
        outputs.push(msg.payload.type);
        if (outputs.length === 2) {
          outputs.should.eql(['leave', 'join']);
          done();
        }
      });

      handler({ channelId: 'old', guild: { id: '1' }, id: 'user1', member: { id: 'user1' } }, { channelId: 'new', guild: { id: '1' }, id: 'user1', member: { id: 'user1' } });
    });
  });
});
