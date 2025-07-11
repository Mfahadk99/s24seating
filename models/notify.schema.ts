import mongoose, { Schema, Document, Model } from "mongoose";

type NotifyStatus = "waiting" | "notified" | "fulfilled" | "expired" | "canceled";

export interface INotifyRequest extends Document {
  restaurantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  requestedTime: Date;
  partySize: number;
  preferredRangeMinutes?: number;
  status: NotifyStatus;
  notifiedAt?: Date;
  fulfilledReservationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notifyRequestSchema = new Schema<INotifyRequest>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    guestName: {
      type: String,
      trim: true,
    },
    guestEmail: {
      type: String,
      lowercase: true,
      validate: {
        validator: (v: string) =>
          !v || /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(v),
        message: "Invalid email format",
      },
    },
    guestPhone: {
      type: String,
      validate: {
        validator: (v: string) => /^[0-9\-+\s()]+$/.test(v),
        message: "Invalid phone number format",
      },
    },
    requestedTime: {
      type: Date,
      required: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    preferredRangeMinutes: {
      type: Number,
      min: 0,
      default: 30, 
    },
    status: {
      type: String,
      enum: ["waiting", "notified", "fulfilled", "expired", "canceled"],
      default: "waiting",
    },
    notifiedAt: {
      type: Date,
    },
    fulfilledReservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notifyRequestSchema.index({ restaurantId: 1, requestedTime: 1 });
notifyRequestSchema.index({ status: 1, requestedTime: 1 });

const NotifyRequest: Model<INotifyRequest> = mongoose.model<INotifyRequest>(
  "NotifyRequest",
  notifyRequestSchema
);

export default NotifyRequest;
