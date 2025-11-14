import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  ipAddress: string;
  userAgent: string;
  successful: boolean;
  timestamp: Date;
  failureReason?: string;
}

const LoginAttemptSchema: Schema = new Schema({
  email: { type: String, required: true, lowercase: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  successful: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  failureReason: { type: String }
});

// Index for efficient queries
LoginAttemptSchema.index({ email: 1, timestamp: -1 });
LoginAttemptSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index to automatically delete old login attempts after 30 days
LoginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model<ILoginAttempt>('LoginAttempt', LoginAttemptSchema);
