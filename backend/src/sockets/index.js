const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/jwt");
const env = require("../config/env");
const logger = require("../utils/logger");

let ioInstance = null;

function roomForActor(actor) {
  if (actor.type === "ADMIN") {
    if (actor.adminType === "SUPER_ADMIN") return "admin:super";
    if (actor.adminType === "ZONE_ADMIN") return `admin:zone:${actor.zoneId}`;
    if (actor.adminType === "TOWN_ADMIN") return `admin:town:${actor.townAdministrationId}`;
    if (actor.adminType === "DISTRICT_ADMIN") return `admin:district:${actor.districtId}`;
    if (actor.adminType === "OFFICE_ADMIN") return `admin:office:${actor.officeId}`;
  }
  return `user:${actor.id}`;
}

function initSockets(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = verifyAccessToken(token);
      socket.actorId = payload.sub;
      socket.actorType = payload.type;
      socket.jurisdiction = payload.jurisdiction || {};
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const personalRoom = socket.actorType === "ADMIN" ? `admin:${socket.actorId}` : `user:${socket.actorId}`;
    socket.join(personalRoom);

    if (socket.actorType === "ADMIN" && socket.jurisdiction.room) {
      socket.join(socket.jurisdiction.room);
    }

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${personalRoom}`);
    });
  });

  return ioInstance;
}

function getIo() {
  if (!ioInstance) throw new Error("Socket.io not initialized yet");
  return ioInstance;
}

/** Emits an event to a specific user or admin's personal room. */
function emitToActor({ type, id }, event, payload) {
  const room = type === "ADMIN" ? `admin:${id}` : `user:${id}`;
  getIo().to(room).emit(event, payload);
}

/** Emits to every admin scoped to a given jurisdiction room, e.g. `admin:district:<id>`. */
function emitToJurisdiction(room, event, payload) {
  getIo().to(room).emit(event, payload);
}

module.exports = { initSockets, getIo, emitToActor, emitToJurisdiction, roomForActor };
