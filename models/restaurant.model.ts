import mongoose, { Schema, Document, Model } from "mongoose";

//Interface for Address
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

//Interface for Operating Hours
interface OperatingHours {
  openTime?: string;
  closeTime?: string;
  isOpen?: boolean;
}

//Interface for Restaurant Document
export interface IRestaurant extends Document {
  name: string;
  description?: string;
  phone: string;
  email: string;
  address: Address;
  businessType: "restaurant" | "cafe" | "bar" | "pub" | "bistro";
  operatingHours: OperatingHours;
  status: "active" | "inactive" | "closed";
  owner: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  fullAddress: string;
}

// Schema Definition
const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^[0-9\-+\s()]+$/.test(v),
        message: "Invalid phone number format",
      },
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
      validate: {
        validator: (v: string) => /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(v),
        message: "Invalid email format",
      },
    },
    address: {
      street: { type: String, required: true, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      state: { type: String, required: true, trim: true, maxlength: 50 },
      zipCode: { type: String, required: true, trim: true, maxlength: 20 },
    },
    businessType: {
      type: String,
      enum: ["restaurant", "cafe", "bar", "pub", "bistro"],
      default: "restaurant",
    },
    operatingHours: {
      openTime: { type: String, default: "09:00" },
      closeTime: { type: String, default: "22:00" },
      isOpen: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "closed"],
      default: "active",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// Model
const Restaurant: Model<IRestaurant> = mongoose.model<IRestaurant>("Restaurant", restaurantSchema);

export default Restaurant;
