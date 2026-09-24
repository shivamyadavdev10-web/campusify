import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['info', 'alert', 'course_update'], default: 'info' },
    targetAudience: { 
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
        semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', default: null }
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null }
}, { timestamps: true });

// Optimize querying active notifications
notificationSchema.index({ isActive: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
