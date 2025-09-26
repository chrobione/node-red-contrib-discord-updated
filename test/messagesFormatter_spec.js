const should = require('should');
const { formatComponents, formatAttachments } = require('../discord/lib/messagesFormatter');

describe('messagesFormatter formatComponents', () => {
  it('builds action rows for entity select menus', () => {
    const rows = formatComponents([
      {
        type: 1,
        components: [
          { type: 5, custom_id: 'user-select', placeholder: 'Pick a user' },
          { type: 6, custom_id: 'role-select', placeholder: 'Pick a role' },
        ],
      },
    ]);

    rows.should.be.Array().and.have.length(1);
    const json = rows[0].toJSON();
    json.components.should.have.length(2);
    json.components[0].type.should.equal(5);
    json.components[0].custom_id.should.equal('user-select');
    json.components[1].type.should.equal(6);
    json.components[1].custom_id.should.equal('role-select');
  });
});

describe('messagesFormatter formatAttachments', () => {
  const sampleBuffer = Buffer.from('file');

  it('applies description, spoiler, and duration metadata', () => {
    const [attachment] = formatAttachments([
      {
        buffer: sampleBuffer,
        name: 'voice.ogg',
        description: 'Recorded queue audio',
        spoiler: true,
        duration: 12.5,
      },
    ]);

    attachment.should.have.property('description', 'Recorded queue audio');
    attachment.should.have.property('spoiler', true);
    attachment.name.should.match(/^SPOILER_/);
    attachment.should.have.property('duration_secs', 12.5);
  });

  it('allows duration in milliseconds and normalises to seconds', () => {
    const [attachment] = formatAttachments([
      {
        buffer: sampleBuffer,
        name: 'clip.mp3',
        durationMs: 1500,
      },
    ]);

    attachment.should.have.property('duration_secs').which.is.approximately(1.5, 0.0001);
  });

  it('throws if duration values are invalid', () => {
    (() => formatAttachments([{ buffer: sampleBuffer, duration: 'nope' }]))
      .should.throw('Attachment duration must be a finite number.');
    (() => formatAttachments([{ buffer: sampleBuffer, duration: -1 }]))
      .should.throw('Attachment duration cannot be negative.');
    (() => formatAttachments([{ buffer: sampleBuffer, duration: 10, durationMs: 1000 }]))
      .should.throw('Specify attachment duration in either seconds or milliseconds, not both.');
  });
});
