import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { EMAIL_PATTERN, optionalHttpUrl } from '../utils/validators.js';

const SALT_ROUNDS = 10;

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
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.matchPassword = function matchPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never send the password hash to the client, even if it was selected.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
