import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { 
      type: String, 
      required: true,
      trim: true
    },
    actionUrl: { 
      type: String, 
      trim: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1 });
const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
