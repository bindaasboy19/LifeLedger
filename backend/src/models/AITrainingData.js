import mongoose from 'mongoose';

const AITrainingDataSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    region: { type: String, required: true, index: true },
    bloodGroup: { type: String, required: true, index: true },
    sosCount: { type: Number, required: true, min: 0 },
    usageUnits: { type: Number, required: true, min: 0 },
    campDonationVolume: { type: Number, required: true, min: 0 }
  },
  {
    timestamps: true,
    collection: 'ai_training_data'
  }
);

AITrainingDataSchema.index({ date: 1, region: 1, bloodGroup: 1 }, { unique: true });

export const AITrainingData = mongoose.model('AITrainingData', AITrainingDataSchema);
