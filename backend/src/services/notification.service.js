const prisma = require("../config/db");
const { emitToActor } = require("../sockets/index");

/**
 * Creates a notification row and pushes it in real time to the recipient if they're connected.
 * recipient: { type: 'USER'|'ADMIN', id }
 */
async function notify({ recipient, type, title, message, link }) {
  const notification = await prisma.notification.create({
    data: {
      recipientType: recipient.type,
      userId: recipient.type === "USER" ? recipient.id : null,
      adminId: recipient.type === "ADMIN" ? recipient.id : null,
      type,
      title,
      message,
      link,
    },
  });

  try {
    emitToActor(recipient, "notification:new", notification);
  } catch {
    // socket layer may not be initialized (e.g. during tests/seed) — DB row still persists
  }

  return notification;
}

async function notifyMany(recipients, payload) {
  return Promise.all(recipients.map((recipient) => notify({ recipient, ...payload })));
}

module.exports = { notify, notifyMany };
