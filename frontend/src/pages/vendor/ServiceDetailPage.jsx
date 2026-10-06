import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12.5 4.5 6 10l6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 17 5-5 3.5 3.5L16 12l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(dateString) {
  if (!dateString) {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function DetailField({ label, value }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-black/40">{label}</span>
      <p className="text-sm font-medium text-black">{value}</p>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passedService = location.state?.service;
  const hasPassedService = Boolean(passedService && passedService.id === id);

  const [service, setService] = useState(hasPassedService ? passedService : null);
  const [loading, setLoading] = useState(!hasPassedService);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasPassedService) {
      return undefined;
    }

    let cancelled = false;

    async function loadService() {
      try {
        const response = await api.get(`/services/${id}`);
        if (!cancelled) {
          setService(response.data.data.service);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Unable to load service.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadService();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-black/60">Loading…</p>;
  }

  if (error || !service) {
    return (
      <div>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error || 'Service not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/vendor/services')}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-black/60 hover:text-black"
        >
          <BackIcon />
          Back to Service Management
        </button>
      </div>
    );
  }

  const images = service.images || [];
  const mainImage = images[0]?.image_url || service.image_url;
  const thumbnails = images.slice(1);

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/vendor/services')}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-black/60 hover:text-black"
      >
        <BackIcon />
        Back to Service Management
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="relative h-80 w-full bg-gray-100 sm:h-96">
          {mainImage ? (
            <img src={mainImage} alt={service.service_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImagePlaceholderIcon />
            </div>
          )}

          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${
              service.availability === 'Inactive' ? 'bg-rose-500 text-white' : 'ui-yellow text-black'
            }`}
          >
            {service.availability === 'Inactive' ? 'Unavailable' : 'Available'}
          </span>

          <button
            type="button"
            onClick={() => navigate(`/vendor/services/${service.id}/edit`, { state: { service } })}
            className="ui-yellow ui-yellow-hover absolute right-4 top-4 rounded-full px-5 py-2 text-sm font-semibold text-black shadow-sm"
          >
            Edit Service
          </button>
        </div>

        {thumbnails.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto border-b border-gray-100 p-3">
            {thumbnails.map((image) => (
              <img
                key={image.id}
                src={image.image_url}
                alt={service.service_name}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}

        <div className="p-7 sm:p-10">
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black/50">
            {service.service_category || 'Uncategorized'}
          </span>

          <h1 className="mt-3 text-2xl font-bold text-black">{service.service_name}</h1>

          {service.service_description ? (
            <p className="mt-3 text-sm leading-relaxed text-black/60">{service.service_description}</p>
          ) : null}

          <div className="mt-6 border-t border-gray-100 pt-6">
            <span className="ui-yellow-text text-[11px] font-bold uppercase tracking-wide">Starting From</span>
            <p className="text-2xl font-bold text-black">${service.starting_price}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2">
            <DetailField label="Minimum Guest Capacity" value={service.minimum_guest_capacity ?? 'N/A'} />
            <DetailField label="Maximum Guest Capacity" value={service.maximum_guest_capacity ?? 'N/A'} />
            <DetailField label="Estimated Setup Time" value={service.estimated_setup_time || 'N/A'} />
            <DetailField label="Availability" value={service.availability} />
            <DetailField label="Last Updated" value={formatDate(service.updated_at)} />
            <DetailField label="Created" value={formatDate(service.created_at)} />
          </div>
        </div>
      </div>
    </div>
  );
}
