import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { createSocketServer } from './config/socket.js';
import { cleanupStaleChatSessions } from './modules/chat/chat.service.js';
import {
  retryPendingBookingConfirmationEmails,
  verifyBookingConfirmationEmailTransport,
} from './modules/bookings/bookingConfirmationEmail.service.js';

const app = createApp();
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer);
app.set('io', io);

httpServer.listen(env.PORT, () => {
  console.log(`Lune backend running on http://localhost:${env.PORT}`);
});

const CHAT_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
const BOOKING_EMAIL_RETRY_INTERVAL_MS = 60 * 1000;

async function runChatCleanup() {
  try {
    const result = await cleanupStaleChatSessions();
    if (result.closed || result.deleted) console.log('Chat cleanup completed', result);
  } catch (error) {
    console.error('Chat cleanup failed', error.message);
  }
}

runChatCleanup();
setInterval(runChatCleanup, CHAT_CLEANUP_INTERVAL_MS).unref();

async function runBookingEmailRetry() {
  try {
    const result = await retryPendingBookingConfirmationEmails();
    if (result.attempted) console.log('Booking confirmation email retry completed', result);
  } catch (error) {
    console.error('Booking confirmation email retry failed', error.message);
  }
}

runBookingEmailRetry();
setInterval(runBookingEmailRetry, BOOKING_EMAIL_RETRY_INTERVAL_MS).unref();
void verifyBookingConfirmationEmailTransport();
