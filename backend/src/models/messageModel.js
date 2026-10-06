const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const MESSAGE_COLUMNS = 'id, conversation_id, user_id, message, message_type, created_at';

async function createMessage(fields) {
  const { data, error } = await supabase
    .from('messages')
    .insert(fields)
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to send message.');
  }

  return data;
}

async function listByConversationId(conversation_id) {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(500, error.message || 'Unable to load messages.');
  }

  return data;
}

async function findLatestForConversations(conversation_ids) {
  if (!conversation_ids.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .in('conversation_id', conversation_ids)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to load latest messages.');
  }

  return data;
}

async function countUnreadForConversations(conversation_ids, user_id) {
  if (!conversation_ids.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversation_ids)
    .neq('user_id', user_id)
    .is('read_at', null);

  if (error) {
    return [];
  }

  return data;
}

async function findRecentFromOthers(conversation_ids, excludeUserId, limit = 10) {
  if (!conversation_ids.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, user_id, message, created_at')
    .in('conversation_id', conversation_ids)
    .neq('user_id', excludeUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError(500, error.message || 'Unable to load recent messages.');
  }

  return data;
}

async function markReadForConversation(conversation_id, user_id) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversation_id)
    .neq('user_id', user_id)
    .is('read_at', null);

  if (error) {
    throw new AppError(500, error.message || 'Unable to mark messages as read.');
  }
}

module.exports = {
  createMessage,
  listByConversationId,
  findLatestForConversations,
  countUnreadForConversations,
  findRecentFromOthers,
  markReadForConversation,
};
