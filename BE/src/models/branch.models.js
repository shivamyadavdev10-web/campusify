import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      unique: true // Example: "Computer Engineering"
    },
    shortName: { 
      type: String, 
      required: true,
      trim: true // Example: "CE" ya "CS"
    },
    description: { 
      type: String, 
      trim: true 
    },
    icon: { 
      type: String // Frontend par branch ka logo dikhane ke liye URL
    },
    detailsUrl: { 
      type: String, 
      trim: true,
      default: 'https://campusifyplus.in/online-classes/' // Fallback URL
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);
branchSchema.index({ isActive: 1 });
const Branch = mongoose.model("Branch", branchSchema);
export default Branch;