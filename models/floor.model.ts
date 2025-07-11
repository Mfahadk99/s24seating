import mongoose, { Document, Schema, Model } from "mongoose";

//Interface for canvas dimensions
interface CanvasDimensions {
  width: number;
  height: number;
}

//FloorPlan interface
export interface IFloorPlan extends Document {
  name: string;
  description?: string;
  restaurantId: mongoose.Types.ObjectId;
  isActive: boolean;
  canvasDimensions: CanvasDimensions;
  createdAt: Date;
  updatedAt: Date;
}

// Define Schema
const floorPlanSchema = new Schema<IFloorPlan>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    canvasDimensions: {
      width: {
        type: Number,
        default: 2000,
        min: 500,
        max: 5000,
      },
      height: {
        type: Number,
        default: 1500,
        min: 500,
        max: 5000,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
floorPlanSchema.index({ restaurantId: 1, isActive: 1 });
floorPlanSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

// Static method to find active floor plans by restaurant
floorPlanSchema.statics.findByRestaurant = function (
  this: Model<IFloorPlan>,
  restaurantId: string
) {
  return this.find({ restaurantId, isActive: true });
};

// Model
const FloorPlan: Model<IFloorPlan> = mongoose.model<IFloorPlan>(
  "FloorPlan",
  floorPlanSchema
);

export default FloorPlan;
