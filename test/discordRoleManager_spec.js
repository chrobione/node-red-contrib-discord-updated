const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');

const discordRoleManager = require('../discord/discordRoleManager');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');
const discordFramework = require('../discord/lib/discordFramework');

helper.init(require.resolve('node-red'));

describe('discordRoleManager Node', function () {
  let getBotStub;
  let getGuildStub;
  let guild;

  beforeEach(function () {
    guild = {
      roles: {
        fetch: sinon.stub().withArgs('role123').resolves({ id: 'role123', members: { size: 3 } }),
      },
      members: {
        fetch: sinon.stub()
          .onFirstCall().resolves(new Map([
            ['1', { id: '1', roles: { cache: { has: () => true } } }],
            ['2', { id: '2', roles: { cache: { has: () => true } } }],
          ]))
          .onSecondCall().resolves(new Map([
            ['3', { id: '3', roles: { cache: { has: () => true } } }],
          ]))
          .onThirdCall().resolves(new Map()),
      },
    };

    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves({ });
    getGuildStub = sinon.stub(discordFramework, 'getGuild').resolves(guild);
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('lists members for a role across pages', function (done) {
    const flow = [
      { id: 'n1', type: 'discordRoleManager', name: 'roles', token: 't1', wires: [['n2']] },
      { id: 't1', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordRoleManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.on('input', function (msg) {
        try {
          msg.payload.should.be.Array().and.have.length(3);
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({
        action: 'listMembers',
        guild: 'guild123',
        role: 'role123',
        roleQuery: {
          limit: 500,
          pageLimit: 5,
        },
      });
    });
  });

  it('returns count for a role', function (done) {
    const flow = [
      { id: 'n1', type: 'discordRoleManager', name: 'roles', token: 't1', wires: [['n2']] },
      { id: 't1', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordRoleManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.on('input', function (msg) {
        try {
          msg.payload.should.have.property('count', 3);
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({
        action: 'count',
        guild: 'guild123',
        role: 'role123',
      });
    });
  });
});
