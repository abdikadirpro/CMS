const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { initSockets } = require("./sockets");
const logger = require("./utils/logger");

const server = http.createServer(app);
initSockets(server);

server.listen(env.port, () => {
  logger.info(`CMS API listening on http://localhost:${env.port}`);
});
