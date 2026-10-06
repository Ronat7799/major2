const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const quotationRequestRoutes = require('./routes/quotationRequestRoutes');
const quotationsRoutes = require('./routes/quotationsRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const savedServiceRoutes = require('./routes/savedServiceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const webhookController = require('./controllers/webhookController');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    maxAge: 86400,
  })
);

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'ReabJom API is running.' });
});

app.use('/auth', authRoutes);
app.use('/vendors', vendorRoutes);
app.use('/services', serviceRoutes);
app.use('/quotation-requests', quotationRequestRoutes);
app.use('/quotations', quotationsRoutes);
app.use('/conversations', conversationRoutes);
app.use('/saved-services', savedServiceRoutes);
app.use('/bookings', bookingRoutes);
app.use('/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
