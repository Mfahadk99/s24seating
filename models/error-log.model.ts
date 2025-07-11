import * as mongoose from 'mongoose';

export interface ErrorLogModel extends mongoose.Document {
  request?: {
    method: string;
    path: string;
    statusCode: number;
    origin: string;
    userAgent: string;
    ip: string;
  };
  error?: string; // json | normal string
  source: string;
  createdAt?: any;
  updatedAt?: any;
}

const errorLogSchema = new mongoose.Schema(
  {
    request: {
      type: {
        method: String,
        path: String,
        statusCode: Number,
        origin: String,
        userAgent: String,
        ip: String
      },
      required: false
    },
    error: String,
    source: { type: String, required: true }
  },
  {
    timestamps: true,
    capped: {
      size: 100000000, // maximum size of the collection in bytes (100000000 Bytes ~ 100 MB)
      max: 10000 // maximum number of documents
    }
  }
);

const ErrorLog = mongoose.model<ErrorLogModel>('Error_log', errorLogSchema);

export default ErrorLog;
