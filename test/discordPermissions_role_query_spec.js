const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');

const discordPermissions = require('../discord/discordPermissions');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');

helper.init(require.resolve('node-red'));

describe('discordPermissions role membership', function () {
  let getBotStub;
  let guild;

  beforeEach(function () {
    const memberFactory = (id) => ({
      id,
      roles: { cache: { has: (roleId) => roleId === 'role123' } },
    });

    guild = {
      members: {
        fetch: sinon.stub()
          .onCall(0).resolves(new Map([
            ['1', memberFactory('1')],
            ['2', memberFactory('2')],
            ['3', memberFactory('3')],
          ]))
          .onCall(1).resolves(new Map()),
      },
    };

    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves({ guilds: { fetch: sinon.stub().resolves(guild) } });
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('lists members by role with pagination', function (done) {
    const flow = [
      { id: 'n1', type: 'discordPermissions', name: 'perm', token: 't1', wires: [['n2']] },
      { id: 't1', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordPermissions], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.on('input', function (msg) {
        try {
          msg.payload.should.be.Array().and.have.length(3);
          guild.members.fetch.called.should.be.true();
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({
        action: 'list',
        guild: 'guild123',
        roleQuery: {
          role: 'role123',
          limit: 500,
        },
      });
    });
  });
});
