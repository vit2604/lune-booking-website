import { sendSuccess } from '../../utils/responseUtils.js';
import {
  addBlockedDate,
  createAdminRoom,
  deleteAdminRoom,
  deleteBlockedDate,
  getAdminRoom,
  getPublicRoom,
  getRoomAvailability,
  listAdminRooms,
  listPublicRooms,
  updateAdminRoom,
  updateRoomStatus,
} from './room.service.js';

export async function publicRooms(req, res, next) {
  try {
    return sendSuccess(res, await listPublicRooms(req.validated.query));
  } catch (error) {
    return next(error);
  }
}

export async function publicRoom(req, res, next) {
  try {
    return sendSuccess(res, await getPublicRoom(req.validated.params.slug, req.validated.query));
  } catch (error) {
    return next(error);
  }
}

export async function publicAvailability(req, res, next) {
  try {
    return sendSuccess(res, await getRoomAvailability(req.validated.params.id, req.validated.query));
  } catch (error) {
    return next(error);
  }
}

export async function adminRooms(_req, res, next) {
  try {
    return sendSuccess(res, await listAdminRooms());
  } catch (error) {
    return next(error);
  }
}

export async function adminRoom(req, res, next) {
  try {
    return sendSuccess(res, await getAdminRoom(req.validated.params.id));
  } catch (error) {
    return next(error);
  }
}

export async function adminCreateRoom(req, res, next) {
  try {
    return sendSuccess(res, await createAdminRoom(req.validated.body), 'Room created', 201);
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdateRoom(req, res, next) {
  try {
    return sendSuccess(res, await updateAdminRoom(req.params.id, req.validated.body), 'Room updated');
  } catch (error) {
    return next(error);
  }
}

export async function adminDeleteRoom(req, res, next) {
  try {
    return sendSuccess(res, await deleteAdminRoom(req.validated.params.id), 'Room removed or hidden');
  } catch (error) {
    return next(error);
  }
}

export async function adminUpdateRoomStatus(req, res, next) {
  try {
    return sendSuccess(res, await updateRoomStatus(req.validated.params.id, req.validated.body.status), 'Status updated');
  } catch (error) {
    return next(error);
  }
}

export async function adminAddBlockedDate(req, res, next) {
  try {
    return sendSuccess(res, await addBlockedDate(req.validated.params.id, req.validated.body), 'Blocked date added', 201);
  } catch (error) {
    return next(error);
  }
}

export async function adminDeleteBlockedDate(req, res, next) {
  try {
    return sendSuccess(
      res,
      await deleteBlockedDate(req.validated.params.id, req.validated.params.blockedDateId),
      'Blocked date removed',
    );
  } catch (error) {
    return next(error);
  }
}
