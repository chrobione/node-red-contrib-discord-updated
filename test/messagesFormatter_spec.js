const should = require('should');
const { formatComponents } = require('../discord/lib/messagesFormatter');

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
