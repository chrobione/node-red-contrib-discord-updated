const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');

const discordCommandManager = require('../discord/discordCommandManager');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');
const { REST } = require('discord.js');

helper.init(require.resolve('node-red'));

describe('Discord Command Manager Node', function () {
  let getBotStub;
  let restPostStub;

  beforeEach(function () {
    restPostStub = sinon.stub(REST.prototype, 'post').resolves([]);
    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves({
      token: 'token123',
      id: 'app123',
      application: { fetch: sinon.stub().resolves({ id: 'app123' }) },
    });
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('maps localisation fields when setting commands', function (done) {
    const flow = [
      { id: 'n1', type: 'discordCommandManager', name: 'cmds', token: 't1', wires: [['n2']] },
      { id: 't1', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    const command = {
      name: 'greet',
      description: 'Say hi',
      nameLocalizations: { fr: 'saluer' },
      descriptionLocalizations: { fr: 'Dire bonjour' },
      options: [
        {
          type: 3,
          name: 'target',
          description: 'Who to greet',
          nameLocalizations: { fr: 'cible' },
          descriptionLocalizations: { fr: 'Qui saluer' },
          choices: [
            {
              name: 'Everyone',
              value: 'everyone',
              nameLocalizations: { fr: 'Tout le monde' },
              valueLocalizations: { fr: 'tout' },
            }
          ]
        }
      ]
    };

    helper.load([discordToken, discordCommandManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.on('input', function (msg) {
        try {
          restPostStub.calledOnce.should.be.true();
          const body = restPostStub.firstCall.args[1].body;
          body.should.be.Array().and.have.length(1);
          const payload = body[0];
          payload.should.have.property('name_localizations');
          payload.name_localizations.should.have.property('fr', 'saluer');
          payload.options[0].name_localizations.fr.should.equal('cible');
          payload.options[0].choices[0].value_localizations.fr.should.equal('tout');
          payload.should.not.have.property('nameLocalizations');
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({ action: 'set', commands: command });
    });
  });
});
