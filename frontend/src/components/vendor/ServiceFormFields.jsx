import SelectField from '../SelectField.jsx';
import TextAreaField from '../TextAreaField.jsx';
import TextField from '../TextField.jsx';
import ToggleSwitch from '../ToggleSwitch.jsx';
import { SETUP_TIME_UNITS, VENDOR_CATEGORIES } from '../../constants/auth.js';

export default function ServiceFormFields({ form, update }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
      <TextField
        label="Service Name"
        value={form.service_name}
        onChange={(event) => update('service_name', event.target.value)}
        required
      />
      <SelectField
        label="Service Category"
        placeholder="Select category"
        value={form.service_category}
        onChange={(event) => update('service_category', event.target.value)}
        options={VENDOR_CATEGORIES}
        required
      />
      <TextField
        label="Starting Price"
        type="number"
        value={form.starting_price}
        onChange={(event) => update('starting_price', event.target.value)}
        required
      />
      <TextField
        label="Minimum Guest Capacity"
        type="number"
        value={form.minimum_guest_capacity}
        onChange={(event) => update('minimum_guest_capacity', event.target.value)}
      />
      <TextField
        label="Maximum Guest Capacity"
        type="number"
        value={form.maximum_guest_capacity}
        onChange={(event) => update('maximum_guest_capacity', event.target.value)}
      />
      <TextField
        label="Estimated Setup Time"
        type="number"
        value={form.estimated_setup_time_value}
        onChange={(event) => update('estimated_setup_time_value', event.target.value)}
        placeholder="e.g. 4"
      />
      <SelectField
        label="Setup Time Unit"
        placeholder="Select unit"
        value={form.estimated_setup_time_unit}
        onChange={(event) => update('estimated_setup_time_unit', event.target.value)}
        options={SETUP_TIME_UNITS}
      />
      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 md:col-span-2">
        <span className="text-sm font-medium text-black">Availability</span>
        <ToggleSwitch
          checked={form.availability === 'Active'}
          onChange={(value) => update('availability', value ? 'Active' : 'Inactive')}
          label="Availability"
        />
      </div>
      <div className="md:col-span-2">
        <TextAreaField
          label="Service Description"
          value={form.service_description}
          onChange={(event) => update('service_description', event.target.value)}
        />
      </div>
    </div>
  );
}
