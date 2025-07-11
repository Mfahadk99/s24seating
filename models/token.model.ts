import * as mongoose from 'mongoose';
import { UserModel } from './user.model';

const tokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: [true, 'Please insert a token!']
    },
    type: {
      type: String,
      enum: ['reset-password', 'verify-email'],
      required: [true, 'Please insert a token type!']
    },
    expiresAt: Date,
    is_deleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export interface TokenModel extends mongoose.Document {
  user: UserModel['_id'];
  token: string;
  type: 'reset-password' | 'verify-email';
  expiresAt?: Date;
  is_deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const Token = mongoose.model<TokenModel>('Token', tokenSchema);

export default Token;
