const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');

const discordInteractionManager = require('../discord/discordInteractionManager');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');
const interactionCache = require('../discord/lib/interactionManager');

helper.init(require.resolve('node-red'));

describe('discordInteractionManager node', function () {
  let getBotStub;
  let closeBotStub;
  let getInteractionStub;
  let registerInteractionStub;
  let interaction;

  const buildFlow = () => ([
    { id: 'n1', type: 'discordInteractionManager', token: 'token1', wires: [['n2']] },
    { id: 'token1', type: 'discord-token', token: 'abc' },
    { id: 'n2', type: 'helper' },
  ]);

  beforeEach(function () {
    interaction = {
      reply: sinon.stub().resolves({ id: 'reply-id' }),
      editReply: sinon.stub().resolves({ id: 'edited-id' }),
      followUp: sinon.stub().resolves({ id: 'follow-id' }),
      editFollowUp: sinon.stub().resolves({ id: 'follow-id' }),
      deleteReply: sinon.stub().resolves(),
      deleteFollowUp: sinon.stub().resolves(),
      respond: sinon.stub().resolves(),
      isAutocomplete: sinon.stub().returns(false),
    };

    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves({});
    closeBotStub = sinon.stub(discordBotManager, 'closeBot').resolves();
    getInteractionStub = sinon.stub(interactionCache, 'getInteraction').returns(interaction);
    registerInteractionStub = sinon.stub(interactionCache, 'registerInteraction');
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('sends ephemeral replies when msg.ephemeral is true', function (done) {
    const flow = buildFlow();

    helper.load([discordToken, discordInteractionManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.once('input', function () {
        try {
          sinon.assert.calledOnce(interaction.reply);
          const payload = interaction.reply.firstCall.args[0];
          payload.should.have.property('ephemeral', true);
          payload.should.have.property('flags').which.containEql('Ephemeral');
          registerInteractionStub.should.be.called();
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({ action: 'reply', interactionId: '123', payload: 'hello', ephemeral: true });
    });
  });

  it('sends follow-up messages and carries ephemeral flag', function (done) {
    const flow = buildFlow();

    helper.load([discordToken, discordInteractionManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.once('input', function () {
        try {
          sinon.assert.calledOnce(interaction.followUp);
          const payload = interaction.followUp.firstCall.args[0];
          payload.should.have.property('ephemeral', true);
          payload.should.have.property('flags').which.containEql('Ephemeral');
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({ action: 'followup', interactionId: '123', payload: { content: 'follow up' }, ephemeral: true });
    });
  });

  it('deletes follow-up messages when messageId is provided', function (done) {
    const flow = buildFlow();

    helper.load([discordToken, discordInteractionManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.once('input', function (msg) {
        try {
          sinon.assert.notCalled(interaction.deleteReply);
          sinon.assert.calledOnce(interaction.deleteFollowUp);
          sinon.assert.calledWith(interaction.deleteFollowUp, 'follow-123');
          msg.payload.should.have.property('deleted', true);
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({ action: 'delete', interactionId: '123', messageId: 'follow-123' });
    });
  });
});
