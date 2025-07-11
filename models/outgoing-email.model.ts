import * as mongoose from 'mongoose';

const outgoingEmailSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true
    },
    payload: {
      type: String // store the id of the report or a hash to indicate the sent payload
    }
  },
  { timestamps: true }
);

export interface OutgoingEmailModel extends mongoose.Document {
  to?: any;
  payload?: any;
  createdAt?: any;
  updatedAt?: any;
}

const OutgoingEmail = mongoose.model<OutgoingEmailModel>('Outgoing_email', outgoingEmailSchema);

export default OutgoingEmail;
