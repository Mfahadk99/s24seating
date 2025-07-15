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
  userId: { type: String, required: true },
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Server"
  },
  partySize: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "finished", "removed", "seated", "confirmed"],
    default: "pending",
  },
  metadata: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    specialRequests: { type: String },
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "time-slots",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Performance ke liye index
reservationSchema.index({
  tableId: 1,
  startTime: 1,
  endTime: 1,
  status: 1,
});

const Reservation = model("Reservation", reservationSchema);
export default Reservation;
