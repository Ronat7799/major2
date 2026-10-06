import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/client';
import { getSocket } from '../../api/socket';
import { getErrorMessage } from '../../utils/apiError.js';

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="m17 17-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 3.5h3l1.5 4-2 1.3a9 9 0 0 0 4.7 4.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A13.5 13.5 0 0 1 3 4.6 1.5 1.5 0 0 1 4 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="10.5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m13 8.5 4-2v7l-4-2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="6.7" r="0.9" fill="currentColor" />
    </svg>
  );
}

function AttachmentIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M13.5 6.5 8 12a2.1 2.1 0 1 0 3 3l5.5-5.5a3.6 3.6 0 1 0-5-5L6 10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M4 10h12M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EventTypeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M10 17.5s5.5-4.7 5.5-9A5.5 5.5 0 0 0 4.5 8.5c0 4.3 5.5 9 5.5 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function initialsOf(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const AVATAR_COLORS = ['bg-rose-400', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-teal-500'];

function avatarColorFor(name) {
  const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const STATUS_STYLES = {
  Confirmed: 'bg-green-50 text-green-600',
  Completed: 'bg-sky-50 text-sky-600',
  Pending: 'bg-amber-50 text-amber-600',
  Declined: 'bg-red-50 text-red-600',
  Cancelled: 'bg-red-50 text-red-600',
};

function DetailField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-black/35">{icon}</span>
      <div>
        <p className="text-xs font-medium text-black/40">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-black">{value}</p>
      </div>
    </div>
  );
}

function formatCompactTime(dateString) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

function formatMessageTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatEventDate(dateString) {
  if (!dateString) return 'Not specified';
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
  if (!timeString) return null;
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function formatTimeRange(startTime, endTime) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start && end) return `${start} - ${end}`;
  return start || end || 'Not specified';
}

function formatRange(min, max) {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return 'Not specified';
  if (hasMin && hasMax && Number(min) !== Number(max)) {
    return `${Number(min).toLocaleString('en-US')} - ${Number(max).toLocaleString('en-US')}`;
  }
  return Number(hasMin ? min : max).toLocaleString('en-US');
}

function mapConversation(item) {
  return {
    id: item.id,
    name: item.counterpartName,
    preview: item.preview,
    time: formatCompactTime(item.previewTime),
    status: item.status,
    inviteStatus: item.inviteStatus,
    online: false,
    booking: {
      bookingId: item.bookingCode,
      status: item.status,
      eventType: item.event?.eventType || 'Event',
      eventDate: formatEventDate(item.event?.eventDate),
      eventTime: formatTimeRange(item.event?.startTime, item.event?.endTime),
      eventLocation: item.event?.location || 'Not specified',
      guestsMin: item.event?.guestsMin ?? null,
      guestsMax: item.event?.guestsMax ?? null,
      package: item.packageTotal || 0,
    },
    messages: [],
    messagesLoaded: false,
  };
}

function mapMessage(message) {
  return {
    id: message.id,
    sender: message.sender,
    text: message.message,
    time: formatMessageTime(message.createdAt),
  };
}

const COUNTERPART_SIDE = 'vendor';

export default function CustomerMessagesPage() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('primary');
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [respondingInvite, setRespondingInvite] = useState(false);
  const [onlineMap, setOnlineMap] = useState({});
  const [typingMap, setTypingMap] = useState({});

  const conversationsRef = useRef([]);
  const joinedIdsRef = useRef(new Set());
  const typingTimeoutsRef = useRef({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        const response = await api.get('/conversations');
        if (cancelled) return;
        const mapped = response.data.data.conversations.map(mapConversation);
        setConversations(mapped);

        const requestedId = location.state?.conversationId;
        const requested = mapped.find((conversation) => conversation.id === requestedId);
        if (requested) {
          setActiveTab(requested.inviteStatus === 'invited' ? 'requests' : 'primary');
          setSelectedId(requested.id);
        } else {
          const firstPrimary = mapped.find((conversation) => conversation.inviteStatus !== 'invited' && conversation.inviteStatus !== 'declined');
          if (firstPrimary) {
            setSelectedId(firstPrimary.id);
          } else {
            const firstRequest = mapped.find((conversation) => conversation.inviteStatus === 'invited');
            if (firstRequest) {
              setActiveTab('requests');
              setSelectedId(firstRequest.id);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load messages.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function joinAll() {
      conversationsRef.current.forEach((conversation) => {
        if (!joinedIdsRef.current.has(conversation.id)) {
          joinedIdsRef.current.add(conversation.id);
          socket.emit('join_conversation', { conversationId: conversation.id }, (response) => {
            if (!response?.success || !response.presence) return;
            const isOnline =
              COUNTERPART_SIDE === 'vendor' ? response.presence.vendorOnline : response.presence.customerOnline;
            setOnlineMap((prev) => ({ ...prev, [conversation.id]: isOnline }));
          });
        }
      });
    }

    function handleReconnect() {
      joinedIdsRef.current.clear();
      joinAll();
    }

    joinAll();
    socket.on('connect', handleReconnect);
    return () => socket.off('connect', handleReconnect);
  }, [conversations]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleReceiveMessage({ conversationId, message }) {
      const mapped = mapMessage(message);
      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          if (conversation.messages.some((existing) => existing.id === mapped.id)) return conversation;
          return { ...conversation, messages: [...conversation.messages, mapped], preview: mapped.text, time: 'now' };
        })
      );
    }

    function handleUserOnline({ conversationId, side }) {
      if (side !== COUNTERPART_SIDE) return;
      setOnlineMap((prev) => ({ ...prev, [conversationId]: true }));
    }

    function handleUserOffline({ conversationId, side }) {
      if (side !== COUNTERPART_SIDE) return;
      setOnlineMap((prev) => ({ ...prev, [conversationId]: false }));
    }

    function handleUserTyping({ conversationId, side }) {
      if (side !== COUNTERPART_SIDE) return;
      setTypingMap((prev) => ({ ...prev, [conversationId]: true }));
      clearTimeout(typingTimeoutsRef.current[conversationId]);
      typingTimeoutsRef.current[conversationId] = setTimeout(() => {
        setTypingMap((prev) => ({ ...prev, [conversationId]: false }));
      }, 2000);
    }

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('user_typing', handleUserTyping);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    async function loadDetail() {
      try {
        const response = await api.get(`/conversations/${selectedId}`);
        if (cancelled) return;
        const detail = response.data.data.conversation;
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === selectedId
              ? { ...conversation, messages: detail.messages.map(mapMessage), messagesLoaded: true }
              : conversation
          )
        );
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Unable to load this conversation.'));
      }
    }

    loadDetail();
    getSocket()?.emit('mark_as_read', { conversationId: selectedId });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const active = conversations.find((conversation) => conversation.id === selectedId);

  useEffect(() => {
    if (!active) return;
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [active?.messages?.length, selectedId]);

  function handleSend() {
    const text = draft.trim();
    const socket = getSocket();
    if (!text || !selectedId || sending || !socket) return;

    setSending(true);
    setDraft('');
    socket.emit('send_message', { conversationId: selectedId, message: text }, (response) => {
      setSending(false);
      if (!response?.success) {
        setError(response?.message || 'Unable to send message.');
      }
    });
  }

  function handleDraftChange(event) {
    setDraft(event.target.value);
    if (selectedId) {
      getSocket()?.emit('user_typing', { conversationId: selectedId });
    }
  }

  function handleDraftKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSend();
    }
  }

  async function handleInviteDecision(decision) {
    if (!selectedId || respondingInvite) return;
    setRespondingInvite(true);
    try {
      const response = await api.post(`/conversations/${selectedId}/respond`, { decision });
      const { status } = response.data.data;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedId ? { ...conversation, inviteStatus: status } : conversation
        )
      );
      if (status === 'accepted') {
        setActiveTab('primary');
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to respond to this invite.'));
    } finally {
      setRespondingInvite(false);
    }
  }

  const requestConversations = conversations.filter((conversation) => conversation.inviteStatus === 'invited');
  const primaryConversations = conversations.filter(
    (conversation) => conversation.inviteStatus !== 'invited' && conversation.inviteStatus !== 'declined'
  );
  const tabConversations = activeTab === 'requests' ? requestConversations : primaryConversations;
  const filteredConversations = tabConversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(search.toLowerCase())
  );
  const isCounterpartOnline = active ? onlineMap[active.id] ?? active.online : false;
  const isCounterpartTyping = active ? Boolean(typingMap[active.id]) : false;

  function handleTabChange(tab) {
    setActiveTab(tab);
    setSelectedId(null);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white">
      <div className="flex w-80 shrink-0 flex-col border-r border-gray-100">
        <div className="border-b border-gray-100 px-6 py-5">
          <h1 className="text-xl font-extrabold text-black">Messages</h1>

          <div className="mt-4 flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => handleTabChange('primary')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                activeTab === 'primary' ? 'ui-yellow text-black shadow-sm' : 'text-black/50 hover:text-black'
              }`}
            >
              Your Messages
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('requests')}
              className={`relative flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                activeTab === 'requests' ? 'ui-yellow text-black shadow-sm' : 'text-black/50 hover:text-black'
              }`}
            >
              Message Requests
              {requestConversations.length > 0 ? (
                <span
                  className={`absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                    activeTab === 'requests' ? 'bg-black text-white' : 'bg-[#F5C400] text-black'
                  }`}
                >
                  {requestConversations.length}
                </span>
              ) : null}
            </button>
          </div>

          <div className="relative mt-4">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-black/35">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-xl bg-gray-100 py-2.5 pl-10 pr-3 text-sm text-black outline-none placeholder:text-black/35"
            />
          </div>
        </div>

        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {error ? <p className="px-[21px] py-4 text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="px-[21px] py-6 text-sm text-black/40">Loading conversations...</p>
          ) : filteredConversations.length ? (
            filteredConversations.map((conversation) => {
              const isActive = conversation.id === selectedId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`flex w-full items-center gap-3 px-6 py-4 text-left transition-colors ${
                    isActive ? 'bg-[#F5C400]/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColorFor(conversation.name)}`}
                  >
                    {initialsOf(conversation.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-black">{conversation.name}</p>
                      <span className="shrink-0 text-xs text-black/40">{conversation.time}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-black/50">{conversation.preview}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="px-[21px] py-6 text-sm text-black/40">
              {activeTab === 'requests'
                ? 'No message requests right now.'
                : "No conversations yet. Chat unlocks once you accept a vendor's quotation."}
            </p>
          )}
        </div>
      </div>

      {active ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-8 py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColorFor(active.name)}`}
              >
                {initialsOf(active.name)}
              </div>
              <div>
                <p className="text-sm font-bold text-black">{active.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45">
                  <span className={`h-1.5 w-1.5 rounded-full ${isCounterpartOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {isCounterpartTyping ? 'Typing...' : isCounterpartOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Call"
                className="text-black/40 transition-colors hover:text-black"
              >
                <PhoneIcon />
              </button>
              <button
                type="button"
                aria-label="Video call"
                className="text-black/40 transition-colors hover:text-black"
              >
                <VideoIcon />
              </button>
              <button
                type="button"
                aria-label="Conversation info"
                className="text-black/40 transition-colors hover:text-black"
              >
                <InfoIcon />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-8 py-6">
            {active.messages.length ? (
              active.messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[60%] flex-col ${message.sender === 'customer' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.sender === 'customer' ? 'ui-yellow text-black' : 'bg-gray-100 text-black'
                      }`}
                    >
                      {message.text}
                    </div>
                    <span className="mt-1.5 px-1 text-[11px] text-black/35">{message.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-black/40">No messages yet. Say hello!</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {active.inviteStatus === 'invited' ? (
            <div className="border-t border-gray-100 px-8 py-4">
              <p className="text-sm text-black/60">
                {active.name} wants to chat with you about this quotation. Accept to start messaging.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleInviteDecision('accept')}
                  disabled={respondingInvite}
                  className="ui-yellow ui-yellow-hover rounded-full px-5 py-2 text-sm font-semibold text-black shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleInviteDecision('decline')}
                  disabled={respondingInvite}
                  className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-black/60 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-t border-gray-100 px-8 py-4">
              <button
                type="button"
                aria-label="Attach file"
                className="flex h-9 w-9 shrink-0 items-center justify-center text-black/40 transition-colors hover:text-black"
              >
                <AttachmentIcon />
              </button>
              <input
                type="text"
                value={draft}
                onChange={handleDraftChange}
                onKeyDown={handleDraftKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-sm text-black outline-none placeholder:text-black/35"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className="ui-yellow ui-yellow-hover flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-50"
              >
                <SendIcon />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-black/40">Select a conversation to view messages.</div>
      )}

      {active ? (
        <div className="w-80 shrink-0 overflow-y-auto border-l border-gray-100 px-6 py-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-black">Booking Info</h2>
              <p className="mt-0.5 text-xs text-black/40">
                {active.booking.bookingId ? `#${active.booking.bookingId}` : 'Not booked yet'}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                STATUS_STYLES[active.status] || STATUS_STYLES.Pending
              }`}
            >
              {active.booking.status}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Guests</p>
              <p className="mt-0.5 text-sm font-bold text-black">
                {formatRange(active.booking.guestsMin, active.booking.guestsMax)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Package</p>
              <p className="mt-0.5 text-sm font-bold text-green-600">${active.booking.package.toLocaleString('en-US')}</p>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-bold text-black">Event Details</h3>
          <div className="mt-3 space-y-4 rounded-xl border border-gray-100 p-4">
            <DetailField icon={<EventTypeIcon />} label="Event Type" value={active.booking.eventType} />
            <DetailField icon={<CalendarIcon />} label="Date" value={active.booking.eventDate} />
            <DetailField icon={<ClockIcon />} label="Time" value={active.booking.eventTime} />
            <DetailField icon={<PinIcon />} label="Location" value={active.booking.eventLocation} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
