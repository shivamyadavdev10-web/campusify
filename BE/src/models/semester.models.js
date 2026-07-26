import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Branch", // Branch se linked
      required: true 
    },
    semNumber: { 
      type: Number, 
      required: true // Example: 1, 2, 3
    },
    title: { 
      type: String, 
      required: true,
      trim: true // Example: "Second Year - Sem 3"
    },
    price: { 
      type: Number, 
      required: true 
    },
    thumbnail: { type: String },
    isPublished: { 
      type: Boolean, 
      default: false // Admin jab ready ho tab true kare
    }
  },
  { timestamps: true }
);

// Fast search filtering ke liye index
// semesterSchema.index({ branchId: 1 }); 
semesterSchema.index({ branchId: 1 });
const Semester = mongoose.model("Semester", semesterSchema);
export default Semester;