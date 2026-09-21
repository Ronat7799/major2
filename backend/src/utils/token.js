const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAuthToken(user, extraClaims = {}) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      ...extraClaims,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAuthToken, verifyAuthToken };
