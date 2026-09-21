const { body, validationResult } = require('express-validator');
const { fail } = require('../utils/apiResponse');

const VENDOR_ADDRESSES = ['Phnom Penh', 'Siem Reap', 'Battambang'];
const VENDOR_LANGUAGES = ['Khmer', 'English', 'Chinese', 'French', 'Vietnamese', 'Thai', 'Korean', 'Japanese'];
const MAX_VENDOR_LANGUAGES = 3;

const passwordRule = body('password')
  .isString()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters.');

const registerRules = [
  body('full_name')
    .if(body('role').equals('customer'))
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be between 2 and 120 characters.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 6, max: 30 })
    .withMessage('Phone number must be between 6 and 30 characters.'),
  passwordRule,
  body('role')
    .isIn(['customer', 'vendor'])
    .withMessage('Role must be customer or vendor.'),
  body('confirm_password')
    .optional()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password and confirm password do not match.'),
  body('company_name')
    .if(body('role').equals('vendor'))
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Company name is required for vendor registration.'),
  body('contact_person')
    .if(body('role').equals('vendor'))
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Contact name is required for vendor registration.'),
  body('business_category').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
  body('business_address')
    .if(body('role').equals('vendor'))
    .isIn(VENDOR_ADDRESSES)
    .withMessage(`Business address must be one of: ${VENDOR_ADDRESSES.join(', ')}.`),
];

const changePasswordRules = [
  body('current_password').isString().notEmpty().withMessage('Current password is required.'),
  body('new_password').isString().isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  body('confirm_new_password')
    .optional()
    .custom((value, { req }) => value === req.body.new_password)
    .withMessage('New password and confirm password do not match.'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required.'),
  body('role')
    .optional({ values: 'falsy' })
    .isIn(['customer', 'vendor'])
    .withMessage('Role must be customer or vendor.'),
];

const vendorProfileRules = [
  body('company_name')
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Company name is required.'),
  body('contact_person')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Contact person is required.'),
  body('business_category').optional({ values: 'falsy' }).trim().isLength({ max: 80 }),
  body('business_address')
    .optional({ values: 'falsy' })
    .isIn(VENDOR_ADDRESSES)
    .withMessage(`Business address must be one of: ${VENDOR_ADDRESSES.join(', ')}.`),
  body('business_description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Company description must be 2000 characters or fewer.'),
  body('year_of_experience')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 100 })
    .withMessage('Years of experience must be a whole number between 0 and 100.'),
  body('full_address').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('latitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90.'),
  body('longitude')
    .optional({ values: 'falsy' })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180.'),
  body('full_address').custom((value, { req }) => {
    const hasValue = (field) => {
      const v = req.body[field];
      return v !== undefined && v !== null && String(v).trim() !== '';
    };
    const anyPresent = hasValue('full_address') || hasValue('latitude') || hasValue('longitude');
    const allPresent = hasValue('full_address') && hasValue('latitude') && hasValue('longitude');
    if (anyPresent && !allPresent) {
      throw new Error('Please select a location from the map search before saving.');
    }
    return true;
  }),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 6, max: 30 })
    .withMessage('Phone number must be between 6 and 30 characters.'),
  body('languages_spoken')
    .optional({ values: 'falsy' })
    .isArray({ max: MAX_VENDOR_LANGUAGES })
    .withMessage(`You can select up to ${MAX_VENDOR_LANGUAGES} languages.`)
    .bail()
    .custom((value) => value.every((item) => VENDOR_LANGUAGES.includes(item)))
    .withMessage(`Languages must be one of: ${VENDOR_LANGUAGES.join(', ')}.`),
];

const SETUP_TIME_UNITS = ['Minutes', 'Hours', 'Days'];

const serviceRules = [
  body('service_name')
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Service name is required.'),
  body('service_category').trim().notEmpty().withMessage('Service category is required.'),
  body('starting_price')
    .notEmpty()
    .withMessage('Starting price is required.')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('Starting price must be a positive number.'),
  body('minimum_guest_capacity')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Minimum guest capacity cannot be negative.'),
  body('maximum_guest_capacity')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Maximum guest capacity cannot be negative.')
    .bail()
    .custom((value, { req }) => {
      const min = req.body.minimum_guest_capacity;
      if (min !== undefined && min !== null && String(min).trim() !== '' && Number(value) < Number(min)) {
        throw new Error('Maximum guest capacity must be greater than or equal to minimum guest capacity.');
      }
      return true;
    }),
  body('estimated_setup_time')
    .optional({ values: 'falsy' })
    .trim()
    .matches(new RegExp(`^\\d+(\\.\\d+)?\\s+(${SETUP_TIME_UNITS.join('|')})$`))
    .withMessage('Estimated setup time must be a number followed by Minutes, Hours, or Days.'),
  body('service_description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Service description must be 2000 characters or fewer.'),
  body('availability')
    .optional({ values: 'falsy' })
    .isIn(['Active', 'Inactive'])
    .withMessage('Availability must be Active or Inactive.'),
];

const QUOTATION_EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Graduation', 'Funeral', 'Other'];

const quotationRequestRules = [
  body('vendor_id').isUUID().withMessage('A valid vendor is required.'),
  body('event_type')
    .isIn(QUOTATION_EVENT_TYPES)
    .withMessage(`Event type must be one of: ${QUOTATION_EVENT_TYPES.join(', ')}.`),
  body('event_date').optional({ values: 'falsy' }).isISO8601().withMessage('Event date must be a valid date.'),
  body('start_time').optional({ values: 'falsy' }).trim(),
  body('end_time').optional({ values: 'falsy' }).trim(),
  body('event_location').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('guests_min')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Minimum guests cannot be negative.'),
  body('guests_max')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Maximum guests cannot be negative.')
    .bail()
    .custom((value, { req }) => {
      const min = req.body.guests_min;
      if (min !== undefined && min !== null && String(min).trim() !== '' && Number(value) < Number(min)) {
        throw new Error('Maximum guests must be greater than or equal to minimum guests.');
      }
      return true;
    }),
  body('budget_min')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Minimum budget cannot be negative.'),
  body('budget_max')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Maximum budget cannot be negative.')
    .bail()
    .custom((value, { req }) => {
      const min = req.body.budget_min;
      if (min !== undefined && min !== null && String(min).trim() !== '' && Number(value) < Number(min)) {
        throw new Error('Maximum budget must be greater than or equal to minimum budget.');
      }
      return true;
    }),
  body('additional_event_description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Event description must be 2000 characters or fewer.'),
];

const quotationRules = [
  body('items').isArray({ min: 1 }).withMessage('Add at least one service with a name, quantity, and unit price.'),
  body('items.*.service_name').trim().notEmpty().withMessage('Each service needs a name.'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0.'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price cannot be negative.'),
  body('charges').optional({ values: 'falsy' }).isArray(),
  body('charges.*.charge_name').optional({ values: 'falsy' }).trim(),
  body('charges.*.charge_price').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('service_message')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message to the customer must be 2000 characters or fewer.'),
];

const revisionRequestRules = [
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Note must be 1000 characters or fewer.'),
];

const messageRules = [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters.'),
];

const savedServiceRules = [body('service_id').isUUID().withMessage('A valid service is required.')];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number between 1 and 5.'),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Comment must be 2000 characters or fewer.'),
];

const cancelBookingRules = [
  body('reason').trim().isLength({ min: 1, max: 500 }).withMessage('A cancellation reason is required.'),
];

const respondToInviteRules = [
  body('decision').isIn(['accept', 'decline']).withMessage('Decision must be accept or decline.'),
];

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((item) => ({
    field: item.path,
    message: item.msg,
  }));

  return fail(res, 400, 'Validation failed.', errors);
}

module.exports = {
  registerRules,
  loginRules,
  changePasswordRules,
  vendorProfileRules,
  serviceRules,
  quotationRequestRules,
  quotationRules,
  revisionRequestRules,
  messageRules,
  savedServiceRules,
  reviewRules,
  cancelBookingRules,
  respondToInviteRules,
  validateRequest,
};
