import * as mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import addressSchema, { AddressModel } from "./address.schema";

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      trim: true,
    },
    lastname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    image_url: {
      type: String,
      trim: true,
    },
    phone_numbers: [
      {
        phone_number: String,
        is_active: Boolean,
      },
    ],
    address: addressSchema,
    user_type: {
      type: String, // client | super_admin
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["unverified"],
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_locked: {
      type: Boolean,
      default: false,
    },
    failed_login_attempts: {
      type: Number,
      default: 0,
    },
    last_visit_date: {
      type: Date,
    },
    is_2fa_enabled: {
      type: Boolean,
      default: false,
    },
    verified_devices: [
      {
        device_info: String, // Field to store the last successful device info
        ip_address: String, // Field to store the last successful IP address
      },
    ],
    memberships: [
      {
        name: {
          type: String,
          enum: ["loyalty"],
        },
      },
    ],
  },
  { timestamps: true }
);

export interface UserModel extends mongoose.Document {
  firstname: any;
  lastname: any;
  email: any;
  website: any;
  password?: any;
  image_url?: any;
  phone_numbers: any;
  address: AddressModel;
  user_type: "client" | "super_admin";
  account?: any;
  status?: "unverified" | undefined;
  last_visit_date?: Date;
  is_2fa_enabled?: boolean;
  verified_devices?: any;
  is_deleted?: any;
  is_locked?: any;
  failed_login_attempts: number;
  memberships: any;
  createdAt?: any;
  updatedAt?: any;
}

// plugin local-mongoose, use email instead of username
userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

const User = mongoose.model<UserModel>("User", userSchema);

export default User;
