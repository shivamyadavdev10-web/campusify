import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester", // Semester se linked
      required: true,
    },
    name: { 
      type: String, 
      required: true, 
      trim: true // Example: "Applied Mathematics"
    },
    subjectCode: { 
      type: String, 
      trim: true // Example: "MTH101"
    },
    thumbnail: { type: String },
    orderSequence: { 
      type: Number, 
      default: 0 // App me subject ka order
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// subjectSchema.index({ semesterId: 1, orderSequence: 1 });
subjectSchema.index({ semesterId: 1, isActive: 1, orderSequence: 1 });
const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;