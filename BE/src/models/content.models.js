import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject", // Subject se linked
      required: true,
    },
    title: { 
      type: String, 
      required: true, 
      trim: true // Example: "Chapter 1: Matrices"
    },
    type: {
      type: String,
      enum: ["video", "pdf", "notes"], // Content type (adding notes as it might be used)
      required: true,
    },
    unit: {
      type: String, // e.g., "Unit 1", "Unit 2"
      required: true,
    },
    category: {
      type: String, // e.g., "Notes", "VVIMP", "Question Banks"
      required: false,
    },
    fileKey: {
      type: String,
      required: false,
      select: false, // ⚡ SECURITY: API me link leak nahi hoga
    },
    // Bunny Stream Library ID for this specific content item.
    // Stored so each video knows which library it belongs to,
    // even if the active library changes in the future.
    bunnyLibraryId: {
      type: String,
      required: false,
      select: false, // Hidden from API by default; only included when explicitly selected
    },
    // Bunny Stream Collection ID — maps to a "folder" on Bunny.net.
    // When you create per-subject collections on Bunny, store the
    // collectionId here so you can list/filter videos by subject.
    bunnyCollectionId: {
      type: String,
      required: false,
      select: false,
    },
    fileUrl: {
      type: String,
      required: false,
    },
    duration: { type: String },
    isFree: { 
      type: Boolean, 
      default: false // Demo content ke liye
    },
    orderSequence: {
      type: Number,
      required: true, // Content ka order list me
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

//⚡ ESR INDEX: Prevents MongoDB from scanning unrelated content
contentSchema.index({ subjectId: 1, type: 1, orderSequence: 1 });

const Content = mongoose.model("Content", contentSchema);
export default Content;