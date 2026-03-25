import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    actorUid: { type: String, required: true, index: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'audit_logs'
  }
);

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
