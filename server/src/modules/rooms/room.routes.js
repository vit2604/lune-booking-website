import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validateMiddleware.js';
import {
  adminAddBlockedDate,
  adminCreateRoom,
  adminDeleteBlockedDate,
  adminDeleteRoom,
  adminRoom,
  adminRooms,
  adminUpdateRoom,
  adminUpdateRoomStatus,
  publicAvailability,
  publicRoom,
  publicRooms,
} from './room.controller.js';
import {
  adminRoomSchema,
  availabilityQuerySchema,
  blockedDateSchema,
  deleteBlockedDateSchema,
  publicRoomsQuerySchema,
  roomParamsSchema,
  roomSlugSchema,
  roomStatusSchema,
} from './room.validation.js';

export const publicRoomRouter = Router();
export const adminRoomRouter = Router();

publicRoomRouter.get('/', validate(publicRoomsQuerySchema), publicRooms);
publicRoomRouter.get('/:id/availability', validate(availabilityQuerySchema), publicAvailability);
publicRoomRouter.get('/:slug', validate(roomSlugSchema), publicRoom);

adminRoomRouter.use(requireAuth, requireAdmin);
adminRoomRouter.get('/', adminRooms);
adminRoomRouter.post('/', validate(adminRoomSchema), adminCreateRoom);
adminRoomRouter.get('/:id', validate(roomParamsSchema), adminRoom);
adminRoomRouter.put('/:id', validate(adminRoomSchema), adminUpdateRoom);
adminRoomRouter.delete('/:id', validate(roomParamsSchema), adminDeleteRoom);
adminRoomRouter.patch('/:id/status', validate(roomStatusSchema), adminUpdateRoomStatus);
adminRoomRouter.post('/:id/blocked-dates', validate(blockedDateSchema), adminAddBlockedDate);
adminRoomRouter.delete('/:id/blocked-dates/:blockedDateId', validate(deleteBlockedDateSchema), adminDeleteBlockedDate);
