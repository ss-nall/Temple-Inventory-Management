import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    sarees: {
      type: Number,
      default: 0,
      min: 0
    },
    panchas: {
      type: Number,
      default: 0,
      min: 0
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);

