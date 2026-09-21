import SelectField from '../SelectField.jsx';
import TextAreaField from '../TextAreaField.jsx';
import TextField from '../TextField.jsx';
import { SETUP_TIME_UNITS, VENDOR_CATEGORIES } from '../../constants/auth.js';

export default function ServiceFormFields({ form, update }) {
  return (
    <>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
      <TextAreaField
        label="Service Description"
        value={form.service_description}
        onChange={(event) => update('service_description', event.target.value)}
      />
      <SelectField
        label="Availability"
        placeholder="Select availability"
        value={form.availability}
        onChange={(event) => update('availability', event.target.value)}
        options={['Active', 'Inactive']}
      />
    </>
  );
}
