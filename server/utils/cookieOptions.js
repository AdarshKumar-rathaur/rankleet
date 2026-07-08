const getCookieOptions = (reqOrContext = {}) => {
  const secure = Boolean(
    reqOrContext.secure ||
      reqOrContext.headers?.['x-forwarded-proto'] === 'https' ||
      reqOrContext.headers?.['X-Forwarded-Proto'] === 'https' ||
      reqOrContext.protocol === 'https' ||
      reqOrContext.secure === true
  );

  const cookieDomain = process.env.COOKIE_DOMAIN || null;

  const opts = {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (cookieDomain) {
    opts.domain = cookieDomain;
  }

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

  const cookieDomain = process.env.COOKIE_DOMAIN || null;

  const opts = {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
  };

  if (cookieDomain) {
    opts.domain = cookieDomain;
  }

  return opts;
};

module.exports = { getCookieOptions, getClearCookieOptions };
