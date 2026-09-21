import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import SubmitButton from '../../components/SubmitButton.jsx';
import ServiceFormFields from '../../components/vendor/ServiceFormFields.jsx';
import {
  EMPTY_SERVICE_FORM,
  buildEstimatedSetupTime,
  toServiceFormValues,
  validateServiceForm,
} from '../../utils/serviceForm.js';
import { getErrorMessage } from '../../utils/apiError.js';

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_IMAGES = 12;

export default function ServiceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passedService = location.state?.service;
  const hasPassedService = Boolean(passedService && passedService.id === id);

  const [form, setForm] = useState(() =>
    hasPassedService ? toServiceFormValues(passedService) : EMPTY_SERVICE_FORM
  );
  const [existingImages, setExistingImages] = useState(() =>
    hasPassedService ? passedService.images || [] : []
  );
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(!hasPassedService);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const newImagesRef = useRef(newImages);
  newImagesRef.current = newImages;

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (hasPassedService) {
      return undefined;
    }

    let cancelled = false;

    async function loadService() {
      try {
        const response = await api.get(`/services/${id}`);
        if (!cancelled) {
          const service = response.data.data.service;
          setForm(toServiceFormValues(service));
          setExistingImages(service.images || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function removeExistingImage(imageId) {
    setExistingImages((current) => current.filter((image) => image.id !== imageId));
    setRemovedImageIds((current) => [...current, imageId]);
  }

  function handleImageChange(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) {
      return;
    }

    const remainingSlots = MAX_IMAGES - existingImages.length - newImages.length;
    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    const accepted = selected.slice(0, remainingSlots);
    setError(
      selected.length > accepted.length
        ? `Only ${remainingSlots} more image(s) could be added (max ${MAX_IMAGES}).`
        : ''
    );

    setNewImages((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeNewImage(imageId) {
    setNewImages((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((image) => image.id !== imageId);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const validationError = validateServiceForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('service_name', form.service_name.trim());
      formData.append('service_category', form.service_category);
      formData.append('starting_price', form.starting_price);
      formData.append('minimum_guest_capacity', form.minimum_guest_capacity);
      formData.append('maximum_guest_capacity', form.maximum_guest_capacity);
      formData.append('estimated_setup_time', buildEstimatedSetupTime(form));
      formData.append('service_description', form.service_description.trim());
      formData.append('availability', form.availability);
      removedImageIds.forEach((imageId) => formData.append('remove_image_ids', imageId));
      newImages.forEach((image) => formData.append('images', image.file));

      await api.put(`/services/${id}`, formData, {
        headers: { 'Content-Type': undefined },
      });

      navigate('/vendor/services', { state: { serviceUpdated: true } });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update service.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this service? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setError('');
    setDeleting(true);
    try {
      await api.delete(`/services/${id}`);
      navigate('/vendor/services', { state: { serviceDeleted: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete service.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-black">Edit Service</h1>

      {loading ? <p className="mb-4 text-sm text-black/60">Loading service details…</p> : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <ServiceFormFields form={form} update={update} />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-black">
            Service Images (up to {MAX_IMAGES})
          </span>

          {existingImages.length > 0 || newImages.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-3">
              {existingImages.map((image) => (
                <div key={image.id} className="relative h-20 w-20">
                  <img src={image.image_url} alt="Service" className="h-20 w-20 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(image.id)}
                    aria-label="Remove image"
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs leading-none text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newImages.map((image) => (
                <div key={image.id} className="relative h-20 w-20">
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(image.id)}
                    aria-label={`Remove ${image.file.name}`}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs leading-none text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <input
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-black/70"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          <SubmitButton loading={saving || loading}>Save Changes</SubmitButton>
          <button
            type="button"
            onClick={() => navigate('/vendor/services')}
            disabled={saving || deleting}
            className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting || loading}
          className="w-full rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? 'Deleting…' : 'Delete Service'}
        </button>
      </form>
    </div>
  );
}
