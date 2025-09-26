const helper = require('node-red-node-test-helper');
const sinon = require('sinon');
require('should');

const discordEmojiManager = require('../discord/discordEmojiManager');
const discordToken = require('../discord/discord-token');
const discordBotManager = require('../discord/lib/discordBotManager');
const discordFramework = require('../discord/lib/discordFramework');

helper.init(require.resolve('node-red'));

describe('Discord Emoji Manager Node', function () {
  let getBotStub;
  let getGuildStub;
  let guild;

  beforeEach(function () {
    guild = {
      emojis: {
        create: sinon.stub().resolves({ id: 'emoji1', name: 'smile' }),
        edit: sinon.stub().resolves({ id: 'emoji1', name: 'grin' }),
        delete: sinon.stub().resolves(true),
        fetch: sinon.stub().resolves(new Map([['emoji1', { id: 'emoji1', name: 'smile' }]])),
      },
    };

    getBotStub = sinon.stub(discordBotManager, 'getBot').resolves({});
    getGuildStub = sinon.stub(discordFramework, 'getGuild').resolves(guild);
  });

  afterEach(function () {
    helper.unload();
    sinon.restore();
  });

  it('creates an emoji from a Buffer', function (done) {
    const buffer = Buffer.from('fake', 'utf8');
    const flow = [
      { id: 'n1', type: 'discordEmojiManager', name: 'emoji', token: 't1', wires: [['n2']] },
      { id: 't1', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordEmojiManager], flow, function () {
      const node = helper.getNode('n1');
      const helperNode = helper.getNode('n2');

      helperNode.on('input', function (msg) {
        try {
          guild.emojis.create.calledOnce.should.be.true();
          const options = guild.emojis.create.firstCall.args[0];
          options.name.should.equal('smile');
          Buffer.isBuffer(options.attachment).should.be.true();
          done();
        } catch (err) {
          done(err);
        }
      });

      node.receive({
        action: 'create',
        guild: 'guild1',
        emoji: {
          name: 'smile',
          image: buffer,
        },
      });
    });
  });

  it('refuses to delete without confirmation', function (done) {
    const flow = [
      { id: 'n1', type: 'discordEmojiManager', name: 'emoji', token: 't1', wires: [['n2']] },
      { id: 't1', type: 'discord-token', name: 'token' },
      { id: 'n2', type: 'helper' },
    ];

    helper.load([discordToken, discordEmojiManager], flow, function () {
      const node = helper.getNode('n1');
      node.once('call:error', call => {
        try {
          const err = call.args[0];
          err.should.be.instanceOf(Error);
          err.message.should.match(/deleteConfirm/);
          guild.emojis.delete.called.should.be.false();
          done();
        } catch (assertErr) {
          done(assertErr);
        }
      });

      node.receive({ action: 'delete', guild: 'guild1', emojiId: 'emoji1' });
    });
  });
});
