import mongoose, { Schema, Document, Model } from "mongoose";
// import TimeSlot, { ITimeSlot } from "./timeSlot.model";

export interface IShift extends Document {
    name: string;
    startTime: string;      
    endTime: string;       
    date: Date;             
    day: string;            
    duration: number;       
    bufferTime: number;     
    restaurantId: mongoose.Types.ObjectId;
    // timeSlots: mongoose.Types.ObjectId[] | ITimeSlot[]; 
    active: boolean;        
    
    // Method to generate time slots
    generateTimeSlots(): Promise<mongoose.Types.ObjectId[]>;
}

const ShiftSchema = new Schema<IShift>({
    name: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
 
    day: {
        type: String,
       
    },
    duration: {
        type: Number,
        default: 45,      
        required: true,
    },
    bufferTime: {
        type: Number,
        default: 15,      
        required: true,
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    active: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

// Helper function to convert time string (HH:MM) to minutes since midnight
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper function to convert minutes since midnight to time string (HH:MM)
function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper function to format time for display (e.g., "1:00 PM")
function formatTimeLabel(time: string): string {
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // Convert 0 to 12 for 12 AM
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
}



// Create indexes for faster lookups
ShiftSchema.index({ restaurantId: 1, date: 1 });
ShiftSchema.index({ restaurantId: 1, day: 1 });

const Shift: Model<IShift> = mongoose.model<IShift>("shifts", ShiftSchema);

export default Shift;
