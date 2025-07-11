import * as mongoose from "mongoose";

const contactEmailSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    business: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export interface ContactEmailModel extends mongoose.Document {
  name: string;
  email: string;
  business?: string;
  subject?: string;
  message: string;
}

const ContactEmail = mongoose.model<ContactEmailModel>(
  "Contact_email",
  contactEmailSchema,
);

export default ContactEmail;
