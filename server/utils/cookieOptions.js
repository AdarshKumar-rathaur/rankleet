const getCookieOptions = (reqOrContext = {}) => {
  const secure = Boolean(
    reqOrContext.secure ||
      reqOrContext.headers?.['x-forwarded-proto'] === 'https' ||
      reqOrContext.headers?.['X-Forwarded-Proto'] === 'https' ||
      reqOrContext.protocol === 'https' ||
      reqOrContext.secure === true
  );

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

const getClearCookieOptions = (reqOrContext = {}) => {
  const secure = Boolean(
    reqOrContext.secure ||
      reqOrContext.headers?.['x-forwarded-proto'] === 'https' ||
      reqOrContext.headers?.['X-Forwarded-Proto'] === 'https' ||
      reqOrContext.protocol === 'https' ||
      reqOrContext.secure === true
  );

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
  };
};

module.exports = { getCookieOptions, getClearCookieOptions };
