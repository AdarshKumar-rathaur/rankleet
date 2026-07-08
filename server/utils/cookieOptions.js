const getCookieOptions = (reqOrContext = {}) => {
  const secure = Boolean(
    reqOrContext.secure ||
      reqOrContext.headers?.['x-forwarded-proto'] === 'https' ||
      reqOrContext.headers?.['X-Forwarded-Proto'] === 'https' ||
      reqOrContext.protocol === 'https' ||
      reqOrContext.secure === true
  );

  const opts = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  return opts;
};

const getClearCookieOptions = (reqOrContext = {}) => {
  const secure = Boolean(
    reqOrContext.secure ||
      reqOrContext.headers?.['x-forwarded-proto'] === 'https' ||
      reqOrContext.headers?.['X-Forwarded-Proto'] === 'https' ||
      reqOrContext.protocol === 'https' ||
      reqOrContext.secure === true
  );

  const opts = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  };

  return opts;
};

module.exports = { getCookieOptions, getClearCookieOptions };
