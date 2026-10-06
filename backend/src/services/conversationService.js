const AppError = require('../utils/AppError');
const conversationModel = require('../models/conversationModel');
const messageModel = require('../models/messageModel');
const quotationModel = require('../models/quotationModel');
const quotationRequestModel = require('../models/quotationRequestModel');

const BOOKING_STATUS_LABELS = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatBookingCode(id) {
  return `BK-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

async function ensureConversationForBooking(booking) {
  return conversationModel.createConversation({
    booking_id: booking.id,
    user_id: booking.user_id,
    vendor_id: booking.vendor_id,
  });
}

async function findConversationIdForBooking(bookingId) {
  if (!bookingId) {
    return null;
  }
  const conversation = await conversationModel.findByBookingId(bookingId);
  return conversation ? conversation.id : null;
}

async function attachEventDetails(rows) {
  const quotationIds = [...new Set(rows.map((row) => row.bookings?.quotation_id || row.quotation_id).filter(Boolean))];
  const quotations = await quotationModel.findByIds(quotationIds);
  const quotationById = new Map(quotations.map((quotation) => [quotation.id, quotation]));

  const requestIds = [...new Set(quotations.map((quotation) => quotation.quotation_request_id).filter(Boolean))];
  const requests = await quotationRequestModel.findByIds(requestIds);
  const requestById = new Map(requests.map((request) => [request.id, request]));

  return rows.map((row) => {
    const quotation = quotationById.get(row.bookings?.quotation_id || row.quotation_id);
    const request = quotation ? requestById.get(quotation.quotation_request_id) : null;
    return { row, quotation, request };
  });
}

async function attachLatestMessagesAndUnread(rows, currentUserId) {
  const conversationIds = rows.map((row) => row.id);
  const [latestMessages, unreadRows] = await Promise.all([
    messageModel.findLatestForConversations(conversationIds),
    messageModel.countUnreadForConversations(conversationIds, currentUserId),
  ]);

  const latestByConversation = new Map();
  for (const message of latestMessages) {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, message);
    }
  }

  const unreadCountByConversation = new Map();
  for (const message of unreadRows) {
    unreadCountByConversation.set(
      message.conversation_id,
      (unreadCountByConversation.get(message.conversation_id) || 0) + 1
    );
  }

  return { latestByConversation, unreadCountByConversation };
}

function buildEventSummary(request) {
  return {
    eventType: request?.event_type || null,
    eventDate: request?.event_date || null,
    startTime: request?.start_time || null,
    endTime: request?.end_time || null,
    location: request?.event_location || null,
    guestsMin: request?.guests_min ?? null,
    guestsMax: request?.guests_max ?? null,
  };
}

async function listConversationsForAuth(auth) {
  const isVendor = auth.role === 'vendor';
  if (isVendor && !auth.vendor_id) {
    return [];
  }

  const rows = isVendor
    ? await conversationModel.listForVendor(auth.vendor_id)
    : await conversationModel.listForCustomer(auth.sub);

  if (!rows.length) {
    return [];
  }

  const [enriched, { latestByConversation, unreadCountByConversation }] = await Promise.all([
    attachEventDetails(rows),
    attachLatestMessagesAndUnread(rows, auth.sub),
  ]);

  return enriched.map(({ row, quotation, request }) => {
    const latestMessage = latestByConversation.get(row.id);
    return {
      id: row.id,
      bookingId: row.booking_id,
      bookingCode: row.booking_id ? formatBookingCode(row.booking_id) : null,
      counterpartName: isVendor ? row.users?.full_name || 'Customer' : row.vendors?.company_name || 'Vendor',
      counterpartAvatar: isVendor ? null : row.vendors?.profile_image || null,
      status: BOOKING_STATUS_LABELS[row.bookings?.status] || 'Confirmed',
      inviteStatus: row.status,
      preview: latestMessage ? latestMessage.message : 'No messages yet.',
      previewTime: latestMessage ? latestMessage.created_at : row.updated_at,
      unreadCount: unreadCountByConversation.get(row.id) || 0,
      event: buildEventSummary(request),
      packageTotal: quotation ? quotation.grand_total : null,
    };
  });
}

async function loadOwnedConversation(auth, conversationId) {
  const conversation = await conversationModel.findById(conversationId);
  if (!conversation) {
    throw new AppError(404, 'Conversation not found.');
  }

  const isParticipant =
    auth.role === 'vendor' ? conversation.vendor_id === auth.vendor_id : conversation.user_id === auth.sub;

  if (!isParticipant) {
    throw new AppError(404, 'Conversation not found.');
  }

  return conversation;
}

async function getConversationDetail(auth, conversationId) {
  const conversation = await loadOwnedConversation(auth, conversationId);
  const isVendor = auth.role === 'vendor';

  const [[{ quotation, request }], messages] = await Promise.all([
    attachEventDetails([conversation]),
    messageModel.listByConversationId(conversationId),
  ]);

  return {
    id: conversation.id,
    bookingId: conversation.booking_id,
    bookingCode: conversation.booking_id ? formatBookingCode(conversation.booking_id) : null,
    counterpartName: isVendor
      ? conversation.users?.full_name || 'Customer'
      : conversation.vendors?.company_name || 'Vendor',
    counterpartAvatar: isVendor ? null : conversation.vendors?.profile_image || null,
    status: BOOKING_STATUS_LABELS[conversation.bookings?.status] || 'Confirmed',
    inviteStatus: conversation.status,
    event: buildEventSummary(request),
    packageTotal: quotation ? quotation.grand_total : null,
    messages: messages.map((message) => ({
      id: message.id,
      sender: message.user_id === conversation.user_id ? 'customer' : 'vendor',
      message: message.message,
      messageType: message.message_type,
      createdAt: message.created_at,
    })),
  };
}

async function sendMessage(auth, conversationId, text) {
  const conversation = await loadOwnedConversation(auth, conversationId);

  if (conversation.status === 'declined') {
    throw new AppError(403, 'This chat is no longer available.');
  }

  if (conversation.status === 'invited' && auth.role !== 'vendor') {
    throw new AppError(403, 'This chat has not been accepted yet.');
  }

  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new AppError(400, 'Message cannot be empty.');
  }

  const message = await messageModel.createMessage({
    conversation_id: conversationId,
    user_id: auth.sub,
    message: trimmed,
    message_type: 'text',
  });

  await conversationModel.touchUpdatedAt(conversationId);

  return {
    id: message.id,
    sender: message.user_id === conversation.user_id ? 'customer' : 'vendor',
    message: message.message,
    messageType: message.message_type,
    createdAt: message.created_at,
  };
}

async function markConversationRead(auth, conversationId) {
  await loadOwnedConversation(auth, conversationId);
  await messageModel.markReadForConversation(conversationId, auth.sub);
}

async function createInviteForQuotation({ quotationId, vendorId, customerId }) {
  return conversationModel.createInvite({ quotation_id: quotationId, vendor_id: vendorId, user_id: customerId });
}

async function findInviteForQuotation(quotationId) {
  return conversationModel.findByQuotationId(quotationId);
}

async function respondToInvite(auth, conversationId, decision) {
  const conversation = await loadOwnedConversation(auth, conversationId);

  if (conversation.status !== 'invited') {
    throw new AppError(409, 'This invite has already been answered.');
  }

  const updated = await conversationModel.updateStatus(conversationId, decision === 'accept' ? 'accepted' : 'declined');
  return { id: updated.id, status: updated.status };
}

async function listRecentCustomerMessagesForVendor(vendorId, vendorUserId, limit = 10) {
  const conversations = await conversationModel.listForVendor(vendorId);
  if (!conversations.length) {
    return [];
  }

  const nameByConversationId = new Map(
    conversations.map((conversation) => [conversation.id, conversation.users?.full_name || 'A customer'])
  );

  const messages = await messageModel.findRecentFromOthers(
    conversations.map((conversation) => conversation.id),
    vendorUserId,
    limit
  );

  return messages.map((message) => ({
    id: message.id,
    conversationId: message.conversation_id,
    customerName: nameByConversationId.get(message.conversation_id) || 'A customer',
    createdAt: message.created_at,
  }));
}

async function countUnreadMessagesForVendor(vendorId, vendorUserId) {
  const conversations = await conversationModel.listForVendor(vendorId);
  if (!conversations.length) {
    return 0;
  }

  const unreadRows = await messageModel.countUnreadForConversations(
    conversations.map((conversation) => conversation.id),
    vendorUserId
  );
  return unreadRows.length;
}

module.exports = {
  ensureConversationForBooking,
  findConversationIdForBooking,
  listConversationsForAuth,
  getConversationDetail,
  sendMessage,
  markConversationRead,
  createInviteForQuotation,
  findInviteForQuotation,
  respondToInvite,
  countUnreadMessagesForVendor,
  listRecentCustomerMessagesForVendor,
};
