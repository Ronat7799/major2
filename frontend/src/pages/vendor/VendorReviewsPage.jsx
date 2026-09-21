import { useEffect, useState } from 'react';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-black/15" fill="none" aria-hidden="true">
      <path
        d="M32 8l7 14.5 16 2.3-11.5 11.2 2.7 16L32 44.5 17.8 52l2.7-16L9 24.8l16-2.3L32 8Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarRow({ rating, size = 'h-4 w-4' }) {
  return (
    <span className="flex items-center gap-0.5 text-[#F5C400]">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={size}>
          <StarIcon filled={index < Math.round(rating)} />
        </span>
      ))}
    </span>
  );
}

function initialsOf(name) {
  if (!name) return '';
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

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VendorReviewsPage() {
  const [rating, setRating] = useState({ average: null, total: 0 });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .get('/vendors/me/reviews')
      .then((response) => {
        if (!cancelled) {
          setRating(response.data.data.rating);
          setReviews(response.data.data.reviews);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load your reviews.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div>
        <h1 className="ui-yellow-text text-[28px] font-extrabold tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-black/50">See what customers are saying about your business.</p>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-black/60">Loading…</p>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-4xl font-extrabold text-black">
                {rating.average !== null ? rating.average.toFixed(1) : '—'}
              </span>
              <div>
                {rating.average !== null ? <StarRow rating={rating.average} size="h-5 w-5" /> : null}
                <p className="mt-1 text-sm text-black/50">
                  {rating.total} review{rating.total === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <EmptyStateIcon />
              <p className="mt-4 text-base font-bold text-black">No Reviews Yet</p>
              <p className="mt-1 text-sm text-black/50">Reviews from customers will appear here after completed bookings.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColorFor(
                          review.reviewer_name
                        )}`}
                      >
                        {initialsOf(review.reviewer_name)}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-black">{review.reviewer_name}</p>
                        <p className="text-xs text-black/40">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  {review.comment ? (
                    <p className="mt-3 text-sm leading-relaxed text-black/60">{review.comment}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
