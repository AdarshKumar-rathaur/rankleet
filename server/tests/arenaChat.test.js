const test = require('node:test');
const assert = require('node:assert/strict');
const Message = require('../models/Message');

test('Message schema includes a TTL index that expires after 15 days', () => {
  const indexes = Message.schema.indexes();
  const ttlIndex = indexes.find((entry) => entry[1]?.expireAfterSeconds === 1296000);

  assert.ok(ttlIndex, 'Expected a TTL index for createdAt with expireAfterSeconds 1296000');
  assert.deepEqual(ttlIndex[0], { createdAt: 1 });
});
