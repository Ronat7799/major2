import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client';

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m6.8 10 2.2 2.2 4.2-4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M10 17.5s5.5-4.7 5.5-9A5.5 5.5 0 0 0 4.5 8.5c0 4.3 5.5 9 5.5 9Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="8.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3 4.5h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-3.5 3v-3H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M6 2.5h6l3 3V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 2.5V6h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_STYLES = {
  Confirmed: 'bg-green-50 text-green-600',
  'Pending Payment': 'bg-amber-50 text-amber-600',
  Completed: 'bg-blue-50 text-blue-600',
  Cancelled: 'bg-red-50 text-red-600',
};

const OVERVIEW_PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

function buildSmoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function formatAxisValue(value) {
  if (value >= 1000) {
    return `${Number((value / 1000).toFixed(1)).toString()}K`;
  }
  return `${value}`;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const CHART_PAD_LEFT = 34;
const CHART_PAD_RIGHT = 20;
const CHART_PAD_TOP = 12;
const CHART_PAD_BOTTOM = 24;

function RevenueChart({ points }) {
  const maxValue = Math.max(...points.map((point) => point.value));
  const niceMax = Math.max(Math.ceil(maxValue / 1000) * 1000, 100);
  const plotWidth = CHART_WIDTH - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const baseline = CHART_PAD_TOP + plotHeight;

  const coords = points.map((point, index) => ({
    ...point,
    x: CHART_PAD_LEFT + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth),
    y: baseline - (point.value / niceMax) * plotHeight,
  }));

  const linePath = buildSmoothPath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`;
  const gridFractions = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[220px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="revenueOverviewFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5C400" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F5C400" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridFractions.map((fraction) => {
        const y = CHART_PAD_TOP + plotHeight * fraction;
        const value = Math.round(niceMax * (1 - fraction));
        return (
          <g key={fraction}>
            <line x1={CHART_PAD_LEFT} y1={y} x2={CHART_WIDTH} y2={y} stroke="#F1F1F2" strokeWidth="1" />
            <text x={0} y={y + 3} fontSize="9" fill="#9CA3AF">
              {formatAxisValue(value)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#revenueOverviewFill)" stroke="none" />
      <path d={linePath} fill="none" stroke="#F5C400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {coords.map((point) => (
        <circle key={point.label} cx={point.x} cy={point.y} r="3" fill="white" stroke="#F5C400" strokeWidth="2" />
      ))}

      {coords.map((point) => (
        <text key={point.label} x={point.x} y={CHART_HEIGHT - 4} fontSize="9" fill="#9CA3AF" textAnchor="middle">
          {point.label}
        </text>
      ))}
    </svg>
  );
}

function formatMoney(value) {
  return `$${(Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatEventDate(dateString) {
  if (!dateString) return 'Not specified';
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ATTENTION_COLOR_STYLES = {
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-green-50 text-green-600',
};

function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

const ACTIVITY_TYPE_STYLES = {
  quotation_request: { color: 'blue', icon: <DocumentIcon /> },
  quotation_accepted: { color: 'green', icon: <CheckCircleIcon /> },
  booking_completed: { color: 'violet', icon: <CheckCircleIcon /> },
  review: { color: 'amber', icon: <StarIcon className="h-4 w-4" /> },
  message: { color: 'violet', icon: <MessageIcon /> },
};

function formatRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

function useClickOutsideClose(containerRef, active, onClose) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef, onClose]);
}

function PeriodDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  useClickOutsideClose(containerRef, open, () => setOpen(false));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-1.5 rounded-full border border-[#F5C400]/40 bg-[#F5C400]/15 px-3.5 py-1.5 text-xs font-semibold text-black transition-colors duration-150 hover:bg-[#F5C400]/25"
      >
        {options.find((option) => option.value === value)?.label}
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      <div
        className={`absolute right-0 top-full z-20 mt-2 w-36 origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg transition-all duration-150 ease-out ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors duration-150 ${
              option.value === value ? 'bg-[#F5C400]/20 text-black' : 'text-black/60 hover:bg-black/5'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const BOOKING_STATUS_PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const BOOKING_STATUS_META = {
  Confirmed: { key: 'confirmed', color: '#F5C400' },
  'Pending Payment': { key: 'pending', color: '#3B82F6' },
  Completed: { key: 'completed', color: '#22C55E' },
  Cancelled: { key: 'cancelled', color: '#EF4444' },
  Declined: { key: 'declined', color: '#F97316' },
};

const TOP_SERVICES_PERIODS = [
  { value: 'month', label: 'This Month' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
];

const TOP_SERVICES_RANK_COLORS = ['#F5C400', '#3B82F6', '#EF4444', '#8B5CF6', '#9CA3AF'];

const DONUT_RADIUS = 60;
const DONUT_STROKE = 18;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function BookingStatusDonut({ data, total }) {
  let cumulativeFraction = 0;

  return (
    <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
        <circle cx="80" cy="80" r={DONUT_RADIUS} fill="none" stroke="#F3F4F6" strokeWidth={DONUT_STROKE} />
        {data.map((item) => {
          const fraction = total ? item.value / total : 0;
          const dash = fraction * DONUT_CIRCUMFERENCE;
          const offset = -cumulativeFraction * DONUT_CIRCUMFERENCE;
          cumulativeFraction += fraction;
          return (
            <circle
              key={item.key}
              cx="80"
              cy="80"
              r={DONUT_RADIUS}
              fill="none"
              stroke={item.color}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-extrabold text-black">{total}</p>
        <p className="text-xs text-black/45">Total Bookings</p>
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const [overviewPeriod, setOverviewPeriod] = useState('month');
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setOverviewLoading(true);

    api
      .get(`/vendors/me/revenue-series?period=${overviewPeriod}`)
      .then((response) => {
        if (!cancelled) {
          const series = response.data.data.series;
          setOverviewData({ total: series.totalRevenue, changePercent: series.changePercent, points: series.points });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOverviewData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOverviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [overviewPeriod]);

  const [bookingStatusPeriod, setBookingStatusPeriod] = useState('month');
  const [bookingStatusSummary, setBookingStatusSummary] = useState(null);
  const [bookingStatusLoading, setBookingStatusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/bookings/status-summary')
      .then((response) => {
        if (!cancelled) {
          setBookingStatusSummary(response.data.data.summary);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBookingStatusSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBookingStatusLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const bookingStatusData = (bookingStatusSummary || []).map((item) => ({
    key: BOOKING_STATUS_META[item.status]?.key || item.status,
    label: item.status,
    value: item.count,
    color: BOOKING_STATUS_META[item.status]?.color || '#9CA3AF',
  }));
  const bookingStatusTotal = bookingStatusData.reduce((sum, item) => sum + item.value, 0);

  const [topServicesPeriod, setTopServicesPeriod] = useState('month');
  const [topServices, setTopServices] = useState([]);
  const [topServicesLoading, setTopServicesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setTopServicesLoading(true);

    api
      .get(`/vendors/me/top-services?period=${topServicesPeriod}`)
      .then((response) => {
        if (!cancelled) {
          setTopServices(response.data.data.services);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTopServices([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTopServicesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [topServicesPeriod]);

  const topServicesMaxRevenue = Math.max(1, ...topServices.map((service) => service.revenue));

  useEffect(() => {
    let cancelled = false;
    setRevenueLoading(true);

    api
      .get('/vendors/me/revenue')
      .then((response) => {
        if (!cancelled) {
          setRevenue(response.data.data.revenue);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRevenue(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRevenueLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/vendors/me/stats')
      .then((response) => {
        if (!cancelled) {
          setStats(response.data.data.stats);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/vendors/me/upcoming-events')
      .then((response) => {
        if (!cancelled) {
          setUpcomingEvents(response.data.data.events);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUpcomingEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setEventsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/vendors/me/recent-activity?limit=5')
      .then((response) => {
        if (!cancelled) {
          setRecentActivity(response.data.data.activity);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecentActivity([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setActivityLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div>
        <h1 className="ui-yellow-text text-[28px] font-extrabold tracking-tight">Vendor Dashboard</h1>
        <p className="mt-1 text-sm text-black/50">Welcome back, {user?.full_name}. Here's what's happening today.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-black/45">Total Revenue</p>
          <p className="mt-1 text-2xl font-extrabold text-green-600">
            {revenueLoading ? '…' : revenue === null ? 'N/A' : formatMoney(revenue.totalRevenue)}
          </p>
          {!revenueLoading && revenue !== null ? (
            <p
              className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
                revenue.changePercent >= 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {revenue.changePercent >= 0 ? '▲' : '▼'} {Math.abs(revenue.changePercent)}%
              <span className="font-medium text-black/40">vs last month</span>
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-black/45">Active Bookings</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-600">
            {statsLoading ? '…' : stats === null ? 'N/A' : stats.activeBookings}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-black/45">Pending Quotations</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">
            {statsLoading ? '…' : stats === null ? 'N/A' : stats.pendingQuotations}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-black/45">Completed Events</p>
          <p className="mt-1 text-2xl font-extrabold text-violet-600">
            {statsLoading ? '…' : stats === null ? 'N/A' : stats.completedEvents}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-black/45">Avg. Rating</p>
          <p className="mt-1 text-2xl font-extrabold text-[#B8860B]">
            {statsLoading
              ? '…'
              : stats === null || stats.averageRating === null
                ? 'No reviews yet'
                : `${stats.averageRating.toFixed(1)} (${stats.reviewCount})`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-black">Revenue Overview</h2>
              <p className="mt-1 text-sm text-black/50">Track your revenue performance over time.</p>
            </div>
            <PeriodDropdown options={OVERVIEW_PERIODS} value={overviewPeriod} onChange={setOverviewPeriod} />
          </div>

          {overviewLoading ? (
            <p className="mt-5 text-sm text-black/40">Loading revenue...</p>
          ) : !overviewData ? (
            <p className="mt-5 text-sm text-black/40">Couldn't load revenue data.</p>
          ) : (
            <>
              <div className="mt-4 flex items-baseline gap-3">
                <p className="text-3xl font-extrabold text-black">${overviewData.total.toLocaleString('en-US')}</p>
                <span
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    overviewData.changePercent >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {overviewData.changePercent >= 0 ? '▲' : '▼'} {Math.abs(overviewData.changePercent)}%
                </span>
                <span className="text-sm text-black/40">vs last period</span>
              </div>

              <div className="mt-4">
                <RevenueChart points={overviewData.points} />
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-black">Booking Status</h2>
              <p className="mt-1 text-sm text-black/50">Track the current state of your bookings.</p>
            </div>
            <PeriodDropdown
              options={BOOKING_STATUS_PERIODS}
              value={bookingStatusPeriod}
              onChange={setBookingStatusPeriod}
            />
          </div>

          {bookingStatusLoading ? (
            <p className="mt-5 text-sm text-black/40">Loading booking status...</p>
          ) : bookingStatusTotal === 0 ? (
            <p className="mt-5 text-sm text-black/40">No bookings yet.</p>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
              <BookingStatusDonut data={bookingStatusData} total={bookingStatusTotal} />

              <div className="w-full space-y-3 sm:w-auto">
                {bookingStatusData.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 text-black/70">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="flex items-center gap-2.5">
                      <span className="font-bold text-black">{item.value}</span>
                      <span className="w-9 text-right text-xs text-black/40">
                        {bookingStatusTotal ? Math.round((item.value / bookingStatusTotal) * 100) : 0}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-black">Top Services</h2>
              <p className="mt-1 text-sm text-black/50">See which services bring the most bookings and revenue.</p>
            </div>
            <PeriodDropdown options={TOP_SERVICES_PERIODS} value={topServicesPeriod} onChange={setTopServicesPeriod} />
          </div>

          {topServicesLoading ? (
            <p className="mt-5 text-sm text-black/40">Loading top services...</p>
          ) : topServices.length === 0 ? (
            <p className="mt-5 text-sm text-black/40">No bookings in this period yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-gray-100">
              {topServices.map((service, index) => (
                <div key={service.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: TOP_SERVICES_RANK_COLORS[index] }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-black">{service.name}</p>
                      <p className="shrink-0 text-sm font-bold text-black">${service.revenue.toLocaleString('en-US')}</p>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between gap-3">
                      <p className="truncate text-xs text-black/45">{service.category}</p>
                      <p className="shrink-0 text-xs text-black/45">{pluralize(service.bookings, 'booking')}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(service.revenue / topServicesMaxRevenue) * 100}%`,
                          backgroundColor: TOP_SERVICES_RANK_COLORS[index],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-black">Recent Activity</h2>
            <p className="mt-1 text-sm text-black/50">Your latest updates and events.</p>
          </div>
          <div className="mt-4 divide-y divide-gray-100">
            {activityLoading ? (
              <p className="py-4 text-sm text-black/40">Loading...</p>
            ) : recentActivity.length === 0 ? (
              <p className="py-4 text-sm text-black/40">No recent activity yet.</p>
            ) : (
              recentActivity.map((item) => {
                const style = ACTIVITY_TYPE_STYLES[item.type] || ACTIVITY_TYPE_STYLES.quotation_request;
                const content = (
                  <>
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ATTENTION_COLOR_STYLES[style.color]}`}>
                      {style.icon}
                    </span>
                    <div>
                      <p className="text-sm text-black/75">{item.text}</p>
                      <p className="mt-0.5 text-xs text-black/40">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                  </>
                );

                if (!item.path) {
                  return (
                    <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      {content}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigate(item.path, item.conversationId ? { state: { conversationId: item.conversationId } } : undefined)
                    }
                    className="flex w-full items-start gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-gray-50/70"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-black">Upcoming Events</h2>
          <button
            type="button"
            onClick={() => navigate('/vendor/bookings')}
            className="ui-yellow-text text-sm font-semibold transition-colors hover:opacity-75"
          >
            View All Bookings
          </button>
        </div>

        {eventsLoading ? (
          <p className="py-10 text-center text-sm text-black/40">Loading upcoming events...</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="py-10 text-center text-sm text-black/40">
            No upcoming events yet. Confirmed bookings with a future event date will show up here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wide text-black/40">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Event</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Location</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingEvents.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate('/vendor/bookings')}
                    className="cursor-pointer text-sm transition-colors hover:bg-gray-50/70"
                  >
                    <td className="py-3 pr-4 font-semibold text-black">{row.customer}</td>
                    <td className="py-3 pr-4 text-black/70">{row.event}</td>
                    <td className="py-3 pr-4 text-black/60">{formatEventDate(row.date)}</td>
                    <td className="py-3 pr-4 text-black/60">
                      <span className="flex items-center gap-1.5">
                        <PinIcon /> {row.location}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
