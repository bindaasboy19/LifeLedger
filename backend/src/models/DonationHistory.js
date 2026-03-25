import mongoose from 'mongoose';

const DonationHistorySchema = new mongoose.Schema(
  {
    donorUid: { type: String, required: true, index: true },
    campId: { type: String },
    bloodGroup: { type: String, required: true, index: true },
    units: { type: Number, required: true, min: 1 },
    location: {
      city: { type: String, index: true },
      address: String,
      lat: Number,
      lng: Number
    },
    donatedAt: { type: Date, required: true }
  },
  {
    timestamps: true,
    collection: 'donation_history'
  }
);

export const DonationHistory = mongoose.model('DonationHistory', DonationHistorySchema);
