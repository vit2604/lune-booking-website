export class InAppNotificationProvider {
  constructor(prisma) { this.prisma = prisma; }
  async send({ actorId = null, type, entityId, message, details = {} }) {
    return this.prisma.aiAuditLog.create({ data: { actorId, action: `NOTIFY_${type}`, entityType: 'notification', entityId, details: redact({ message, ...details }) } });
  }
}
import { redact } from '../security/redaction.js';
