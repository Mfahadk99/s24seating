import mongoose, { model, Schema } from "mongoose";

const reservationSchema = new Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TableElement",
    required: true,
  },
  userId: { type: String, required: true }, // Changed from ObjectId to String to support guest users
  partySize: { type: Number, required: true },
  status: {
    type: String,
    enum: ["confirmed", "cancelled", "pending"],
    default: "confirmed",
  },
  metadata: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    specialRequests: { type: String },
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "time-slots", // Changed from "TimeSlot" to "time-slots"
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Reservation = model("Reservation", reservationSchema);

export default Reservation;
