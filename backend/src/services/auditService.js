import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ actorUid, actorRole, action, targetType, targetId, metadata }) => {
  return AuditLog.create({
    actorUid,
    actorRole,
    action,
    targetType,
    targetId,
    metadata
  });
};
