import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import SubmitButton from '../../components/SubmitButton.jsx';
import ServiceFormFields from '../../components/vendor/ServiceFormFields.jsx';
import { EMPTY_SERVICE_FORM, buildEstimatedSetupTime, validateServiceForm } from '../../utils/serviceForm.js';
import { getErrorMessage } from '../../utils/apiError.js';

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_IMAGES = 12;

export default function ServiceCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_SERVICE_FORM);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleImageChange(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) {
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;
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

    setImages((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeImage(id) {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((image) => image.id !== id);
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
      images.forEach((image) => formData.append('images', image.file));

      await api.post('/services', formData, {
        headers: { 'Content-Type': undefined },
      });

      navigate('/vendor/services');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create service.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-black">Add New Service</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <ServiceFormFields form={form} update={update} />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-black">
            Service Images (up to {MAX_IMAGES})
          </span>
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-black/70"
          />
          {images.length > 0 ? (
            <p className="mt-1.5 text-xs text-black/50">
              {images.length} of {MAX_IMAGES} images selected.
            </p>
          ) : null}
          {images.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((image) => (
                <div key={image.id} className="relative h-20 w-20">
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label={`Remove ${image.file.name}`}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs leading-none text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          <SubmitButton loading={saving}>Save Service</SubmitButton>
          <button
            type="button"
            onClick={() => navigate('/vendor/services')}
            disabled={saving}
            className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
