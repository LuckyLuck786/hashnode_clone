import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import httpError from '../utils/httpError.js';

const MIN_PASSWORD_LENGTH = 8;

function authResponse(user) {
  return { token: generateToken(user._id), user };
}

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw httpError(400, 'Name, email and password are required');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (await User.exists({ email: email.trim().toLowerCase() })) {
    throw httpError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(authResponse(user));
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw httpError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  // Same message for unknown email and wrong password so accounts cannot be probed.
  if (!user || !(await user.matchPassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }

  res.json(authResponse(user));
}

// GET /api/auth/me
export function getMe(req, res) {
  res.json({ user: req.user });
}
