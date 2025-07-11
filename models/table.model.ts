import mongoose, { Schema, Document, Model } from "mongoose";

//Table Position Interface
interface Position {
  x: number;
  y: number;
}

//Table Capacity Interface
interface Capacity {
  minParty: number;
  maxParty?: number;
}

// Table Types
type TableType = "round" | "square" | "rectangular" | "hexagon" | "bar";
type TableStatus = "active" | "inactive" | "reserved" | "maintenance";

// Main Interface
export interface ITableElement extends Document {
  tableId: string;
  name: string;
  tableType: TableType;
  seats: number;
  position: Position;
  capacity: Capacity;
  status: TableStatus;
  isReserved: boolean;
  restaurantId: mongoose.Types.ObjectId;
  floorPlanId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definition
const tableElementSchema = new Schema<ITableElement>(
  {
    tableId: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => /^[A-Z0-9]+$/i.test(v),
        message: "Table ID must contain only letters and numbers",
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tableType: {
      type: String,
      required: true,
      enum: ["round", "square", "rectangular", "hexagon", "bar"],
      default: "round",
    },
    seats: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      validate: {
        validator: function (this: any, v: number) {
          // Make sure tableType exists before checking
          if (!this.tableType) return true;
          
          const maxSeats: Record<TableType, number> = {
            round: 16,
            square: 8,
            rectangular: 12,
            hexagon: 8,
            bar: 6,
          };
          return v <= maxSeats[this.tableType];
        },
        message: "Seats exceed maximum for this table type",
      },
    },
    position: {
      x: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      y: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },
    capacity: {
      minParty: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
        default: 1,
      },
      maxParty: {
        type: Number,
        required: false,
        min: 1,
        max: 20,
        validate: {
          validator: function (this: any, v: number) {
            // Check if minParty exists before comparing
            return !this.capacity || !this.capacity.minParty || v >= this.capacity.minParty;
          },
          message: "Max party must be greater than or equal to min party",
        },
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "reserved", "maintenance"],
      default: "active",
    },
    isReserved: {
      type: Boolean,
      default: false,
    },
    floorPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FloorPlan",
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
const TableElement: Model<ITableElement> = mongoose.model<ITableElement>(
  "TableElement",
  tableElementSchema
);

export default TableElement;
