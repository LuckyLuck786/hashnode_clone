import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import httpError from '../utils/httpError.js';

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

async function findUserForToken(token) {
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(id);
}

// Rejects the request unless it carries a valid token for an existing user.
export async function protect(req, res, next) {
  const token = readBearerToken(req);
  if (!token) throw httpError(401, 'Please log in to continue');

  let user;
  try {
    user = await findUserForToken(token);
  } catch {
    throw httpError(401, 'Your session has expired. Please log in again.');
  }
  if (!user) throw httpError(401, 'This account no longer exists');

  req.user = user;
  next();
}

// Attaches req.user when a valid token is present but never blocks the request.
// Used by public routes that show extra data to the owner (for example draft previews).
export async function optionalAuth(req, res, next) {
  const token = readBearerToken(req);
  if (token) {
    try {
      req.user = await findUserForToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
}
