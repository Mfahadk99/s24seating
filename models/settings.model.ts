import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  diningTimes: {
    type: [
      {
        guest: { type: String, required: true }, // "1", "2", ..., "12+"
        time: { type: String, required: true }, // "01:30", "02:00", "03:00"
        bufferTime: { type: String, default: "00:00" }, // "00:15" etc.
        label: { type: String }, // Optional, e.g., "12+ guests"
      },
    ],
    default: [
      { guest: "1", time: "01:30", bufferTime: "00:00" },
      { guest: "2", time: "02:00", bufferTime: "00:00" },
      { guest: "3", time: "02:00", bufferTime: "00:00" },
      { guest: "4", time: "02:00", bufferTime: "00:00" },
      { guest: "5", time: "02:30", bufferTime: "00:00" },
      { guest: "6", time: "02:30", bufferTime: "00:00" },
      { guest: "7", time: "03:00", bufferTime: "00:00" },
      { guest: "8", time: "03:00", bufferTime: "00:00" },
      { guest: "9", time: "03:00", bufferTime: "00:00" },
      { guest: "10", time: "03:00", bufferTime: "00:00" },
      { guest: "11", time: "03:00", bufferTime: "00:00" },
      {
        guest: "12+",
        time: "03:00",
        bufferTime: "00:00",
        label: "12+ guests",
      },
    ],
  },
  
});

export default mongoose.model("Settings", settingsSchema);