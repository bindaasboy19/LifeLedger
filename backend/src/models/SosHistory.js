import mongoose from 'mongoose';

const SosHistorySchema = new mongoose.Schema(
  {
    firestoreId: { type: String, index: true, required: true, unique: true },
    requesterUid: { type: String, required: true },
    assignedDonorUid: { type: String },
    bloodGroup: { type: String, required: true, index: true },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    location: {
      city: { type: String, index: true },
      address: String,
      lat: Number,
      lng: Number
    },
    status: {
      type: String,
      enum: ['created', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'],
      default: 'created',
      index: true
    },
    timeline: [
      {
        status: String,
        changedBy: String,
        at: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'sos_history'
  }
);

export const SosHistory = mongoose.model('SosHistory', SosHistorySchema);
