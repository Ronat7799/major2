const { verifyAuthToken } = require('../utils/token');
const conversationModel = require('../models/conversationModel');
const conversationService = require('../services/conversationService');

function roomName(conversationId) {
  return `conversation:${conversationId}`;
}

async function assertParticipant(auth, conversationId) {
  const conversation = await conversationModel.findById(conversationId);
  if (!conversation) {
    return null;
  }

  const isParticipant =
    auth.role === 'vendor' ? conversation.vendor_id === auth.vendor_id : conversation.user_id === auth.sub;

  return isParticipant ? conversation : null;
}

// In-memory presence: how many active sockets each side (customer/vendor) has
// open in a conversation room. Single Node process only — fine at this
// project's scale; scaling across multiple server instances would need a
// shared store (e.g. the Redis socket.io adapter) instead.
const presenceByRoom = new Map();

function bumpPresence(room, side, delta) {
  const counts = presenceByRoom.get(room) || { customer: 0, vendor: 0 };
  counts[side] = Math.max(0, counts[side] + delta);
  presenceByRoom.set(room, counts);
  return counts[side];
}

function initChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token is required.'));
      }
      socket.auth = verifyAuthToken(token);
      return next();
    } catch {
      return next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    const side = socket.auth.role === 'vendor' ? 'vendor' : 'customer';
    const joinedRooms = new Set();

    function leaveRoom(room, conversationId) {
      if (!joinedRooms.has(room)) return;
      joinedRooms.delete(room);
      socket.leave(room);
      const remaining = bumpPresence(room, side, -1);
      if (remaining === 0) {
        socket.to(room).emit('user_offline', { conversationId, side });
      }
    }

    socket.on('join_conversation', async ({ conversationId } = {}, callback) => {
      try {
        const conversation = await assertParticipant(socket.auth, conversationId);
        if (!conversation) {
          return callback?.({ success: false, message: 'Conversation not found.' });
        }

        const room = roomName(conversationId);
        socket.join(room);
        joinedRooms.add(room);

        const count = bumpPresence(room, side, 1);
        if (count === 1) {
          socket.to(room).emit('user_online', { conversationId, side });
        }

        // Presence is edge-triggered (an event fires only on the next join/leave),
        // so whoever joins later needs the current snapshot too, not just future events.
        const counts = presenceByRoom.get(room);
        return callback?.({
          success: true,
          presence: { customerOnline: counts.customer > 0, vendorOnline: counts.vendor > 0 },
        });
      } catch (error) {
        return callback?.({ success: false, message: 'Unable to join conversation.' });
      }
    });

    socket.on('leave_conversation', ({ conversationId } = {}) => {
      leaveRoom(roomName(conversationId), conversationId);
    });

    socket.on('send_message', async ({ conversationId, message } = {}, callback) => {
      try {
        const sent = await conversationService.sendMessage(socket.auth, conversationId, message);
        io.to(roomName(conversationId)).emit('receive_message', { conversationId, message: sent });
        return callback?.({ success: true, message: sent });
      } catch (error) {
        return callback?.({ success: false, message: error.message || 'Unable to send message.' });
      }
    });

    socket.on('mark_as_read', async ({ conversationId } = {}, callback) => {
      try {
        await conversationService.markConversationRead(socket.auth, conversationId);
        socket.to(roomName(conversationId)).emit('messages_read', { conversationId, by: side });
        return callback?.({ success: true });
      } catch (error) {
        return callback?.({ success: false });
      }
    });

    // Placeholder only — relays a transient typing signal, nothing persisted.
    socket.on('user_typing', ({ conversationId } = {}) => {
      const room = roomName(conversationId);
      if (!joinedRooms.has(room)) return;
      socket.to(room).emit('user_typing', { conversationId, side });
    });

    socket.on('disconnect', () => {
      for (const room of joinedRooms) {
        const conversationId = room.slice('conversation:'.length);
        leaveRoom(room, conversationId);
      }
    });
  });
}

module.exports = initChatSocket;
