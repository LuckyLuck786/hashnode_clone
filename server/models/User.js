import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { EMAIL_PATTERN, optionalHttpUrl } from '../utils/validators.js';

const SALT_ROUNDS = 10;

export const THEMES = ['light', 'dark'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name can be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Enter a valid email address'],
    },
    // Stored as a bcrypt hash and excluded from queries unless explicitly selected.
    password: { type: String, required: [true, 'Password is required'], select: false },
    bio: {
      type: String,
      trim: true,
      maxlength: [200, 'Bio can be at most 200 characters'],
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
      validate: optionalHttpUrl('Avatar URL'),
    },
    // Ids of the authors this user follows. Personalised feeds filter on this field.
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Persisted per account so a signed-in reader keeps their preference across devices.
    theme: {
      type: String,
      enum: { values: THEMES, message: 'Theme must be light or dark' },
      default: 'light',
    },
  },
  { timestamps: true },
);

userSchema.index({ following: 1 });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.matchPassword = function matchPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never send the password hash to the client, even if it was selected.
// `following` is dropped too: it is a list of ids the reader never needs, and the
// public shapes expose following/follower counts instead.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.following;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
