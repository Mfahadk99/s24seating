import mongoose, { model, Schema } from "mongoose";

const waitlistSchema = new Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  userId: { type: String}, 
  partySize: { type: Number, required: true },
  waitingTime: { type: Number, required: true },
  guestInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

const Waitlist = model("Waitlist", waitlistSchema);

export default Waitlist;
