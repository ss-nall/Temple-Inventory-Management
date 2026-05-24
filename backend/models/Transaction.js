import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ADD", "DISTRIBUTE", "ADJUSTMENT"],
      required: true
    },
    sarees: {
      type: Number,
      default: 0
    },
    panchas: {
      type: Number,
      default: 0
    },
    sponsorName: String,
    donorName: String,
    notes: String,
    eventDate: Date,
    date: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);

