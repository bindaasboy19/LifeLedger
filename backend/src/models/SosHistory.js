import mongoose from 'mongoose';

const SosHistorySchema = new mongoose.Schema(
  {
    firestoreId: { type: String, index: true, required: true, unique: true },
    requesterUid: { type: String, required: true },
    assignedDonorUid: { type: String },
    bloodGroup: { type: String, required: true, index: true },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    verifiedStatus: { type: String, default: 'unverified' },
    abuseScore: { type: Number, default: 0 },
    abuseReasons: { type: [String], default: [] },
    location: {
      city: { type: String, index: true },
      district: String,
      state: String,
      address: String,
      lat: Number,
      lng: Number
    },
    status: {
      type: String,
      enum: ['open', 'accepted', 'in_progress', 'completed', 'cancelled', 'unmatched', 'pending_review', 'expired', 'rejected', 'created'],
      default: 'open',
      index: true
    },
    timeline: [
      {
        status: String,
        changedBy: String,
        at: { type: Date, default: Date.now },
        reason: String
      }
    ]
  },
  {
    timestamps: true,
    collection: 'sos_history'
  }
);

export const SosHistory = mongoose.model('SosHistory', SosHistorySchema);
