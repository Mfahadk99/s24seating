import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeSlot extends Document {
    label: string;      // "6:00 PM"
    value: string;      // "18:00"
    order: number;      // 36 (for sorting)
    restaurantId: mongoose.Types.ObjectId;
    duration: number;   // Duration of the slot in minutes (e.g., 30)
    bufferTime: number; // Buffer time in minutes (e.g., 10)
    shiftId: mongoose.Types.ObjectId;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
    label: String,      // "6:00 PM"
    value: String,      // "18:00"
    order: Number,      // 36 (for sorting)
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    duration: {
        type: Number,
        default: 30,      // Default 30 minutes
    },
    bufferTime: {
        type: Number,
        default: 10,      // Default 10 minutes buffer
    },
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shifts",
        required: true,
    },
});

// Create compound index for faster lookups
TimeSlotSchema.index({ restaurantId: 1, order: 1 });
TimeSlotSchema.index({ restaurantId: 1, value: 1 }, { unique: true });

const TimeSlot: Model<ITimeSlot> = mongoose.model<ITimeSlot>("time-slots", TimeSlotSchema);

export default TimeSlot;
