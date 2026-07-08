const test = require('node:test');
const assert = require('node:assert/strict');
const { getCookieOptions } = require('../utils/cookieOptions');

test('uses lax cookies for local HTTP requests', () => {
  const options = getCookieOptions({ secure: false, headers: {} });

  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, false);
  assert.equal(options.sameSite, 'lax');
});

test('uses secure none cookies for HTTPS requests', () => {
  const options = getCookieOptions({ secure: true, headers: {} });

  assert.equal(options.secure, true);
  assert.equal(options.sameSite, 'none');
});

test('treats proxied HTTPS requests as secure', () => {
  const options = getCookieOptions({ secure: false, headers: { 'x-forwarded-proto': 'https' } });

  assert.equal(options.secure, true);
  assert.equal(options.sameSite, 'none');
});
