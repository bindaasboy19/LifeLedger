import mongoose from 'mongoose';

const DonationCertificateSchema = new mongoose.Schema(
  {
    certificateNumber: { type: String, required: true, unique: true, index: true },
    donorUid: { type: String, required: true, index: true },
    donorName: { type: String, required: true },
    campId: { type: String, required: true, index: true },
    campName: { type: String, required: true },
    applicationId: { type: String, required: true, index: true, unique: true },
    organizerUid: { type: String, required: true, index: true },
    organizerName: { type: String, required: true },
    bloodGroup: { type: String, required: true, index: true },
    units: { type: Number, required: true, min: 1 },
    storagePath: { type: String, default: null },
    fileUrl: { type: String, default: null },
    fileContentType: { type: String, default: null },
    generationStatus: { type: String, enum: ['ready', 'pending', 'failed'], default: 'pending' },
    generationError: { type: String, default: null },
    issuedAt: { type: Date, required: true, default: Date.now }
  },
  {
    timestamps: true,
    collection: 'donation_certificates'
  }
);

export const DonationCertificate = mongoose.model('DonationCertificate', DonationCertificateSchema);
