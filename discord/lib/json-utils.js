const { parse, stringify: baseStringify } = require('flatted');

const bigintReplacer = (_, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

const stringify = (value) => baseStringify(value, bigintReplacer);

const clone = (value) => {
  if (value === undefined) {
    return undefined;
  }
  return parse(stringify(value));
};

module.exports = {
  parse,
  stringify,
  clone,
};
