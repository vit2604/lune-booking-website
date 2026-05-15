import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createSocketServer } from './config/socket.js';

const app = createApp();
const httpServer = http.createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Lune backend running on http://localhost:${env.PORT}`);
});
