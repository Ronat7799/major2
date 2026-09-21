import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import VendorDashboardLayout from './layouts/VendorDashboardLayout.jsx';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import AccountPage from './pages/AccountPage.jsx';
import CustomerHomePage from './pages/customer/CustomerHomePage.jsx';
import BrowseVendorsPage from './pages/customer/BrowseVendorsPage.jsx';
import VendorDetailPage from './pages/customer/VendorDetailPage.jsx';
import QuotationRequestPage from './pages/customer/QuotationRequestPage.jsx';
import MyQuotationsPage from './pages/customer/MyQuotationsPage.jsx';
import QuotationDetailPage from './pages/customer/QuotationDetailPage.jsx';
import PaymentPage from './pages/customer/PaymentPage.jsx';
import PaymentSuccessPage from './pages/customer/PaymentSuccessPage.jsx';
import MyBookingsPage from './pages/customer/MyBookingsPage.jsx';
import BookingDetailPage from './pages/customer/BookingDetailPage.jsx';
import ReviewPage from './pages/customer/ReviewPage.jsx';
import CustomerMessagesPage from './pages/customer/CustomerMessagesPage.jsx';
import CustomerProfilePage from './pages/customer/CustomerProfilePage.jsx';
import CustomerChangePasswordPage from './pages/customer/CustomerChangePasswordPage.jsx';
import CustomerRegisterPage from './pages/CustomerRegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterChoicePage from './pages/RegisterChoicePage.jsx';
import VendorRegisterPage from './pages/VendorRegisterPage.jsx';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage.jsx';
import VendorProfilePage from './pages/vendor/VendorProfilePage.jsx';
import ServiceManagementPage from './pages/vendor/ServiceManagementPage.jsx';
import ServiceCreatePage from './pages/vendor/ServiceCreatePage.jsx';
import ServiceEditPage from './pages/vendor/ServiceEditPage.jsx';
import ServiceDetailPage from './pages/vendor/ServiceDetailPage.jsx';
import QuotationRequestsPage from './pages/vendor/QuotationRequestsPage.jsx';
import QuotationRequestDetailPage from './pages/vendor/QuotationRequestDetailPage.jsx';
import CreateQuotationPage from './pages/vendor/CreateQuotationPage.jsx';
import VendorMessagesPage from './pages/vendor/VendorMessagesPage.jsx';
import BookingManagementPage from './pages/vendor/BookingManagementPage.jsx';
import VendorBookingDetailPage from './pages/vendor/BookingDetailPage.jsx';
import VendorReviewsPage from './pages/vendor/VendorReviewsPage.jsx';
import VendorNotificationsPage from './pages/vendor/VendorNotificationsPage.jsx';
import VendorSettingsPage from './pages/vendor/VendorSettingsPage.jsx';
import VendorChangePasswordPage from './pages/vendor/VendorChangePasswordPage.jsx';

export default function App() {
  const location = useLocation();
  // When Login is opened from within the app (nav link, guarded action), the
  // caller stashes the page it was on as backgroundLocation so that page keeps
  // rendering underneath the login modal instead of being replaced by it.
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/register" element={<RegisterChoicePage />} />
        <Route path="/register/customer" element={<CustomerRegisterPage />} />
        <Route path="/register/vendor" element={<VendorRegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/customer" element={<Navigate to="/login" replace />} />
        <Route path="/login/vendor" element={<Navigate to="/login" replace />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <ProtectedRoute role="customer">
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/" replace />} />
          <Route path="profile" element={<CustomerProfilePage />} />
          <Route path="change-password" element={<CustomerChangePasswordPage />} />
          <Route path="quotations" element={<MyQuotationsPage />} />
          <Route path="quotations/:id" element={<QuotationDetailPage />} />
          <Route path="quotations/:id/payment" element={<PaymentPage />} />
          <Route path="quotations/:id/payment/success" element={<PaymentSuccessPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="bookings/:id/review" element={<ReviewPage />} />
          <Route path="messages" element={<CustomerMessagesPage />} />
        </Route>
        {/* Public: guests and customers can browse the homepage and vendors without logging in. */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<CustomerHomePage />} />
          <Route path="/vendors" element={<BrowseVendorsPage />} />
          <Route path="/vendors/:vendorId" element={<VendorDetailPage />} />
          <Route path="/vendors/:vendorId/quotation" element={<QuotationRequestPage />} />
        </Route>
        <Route
          path="/vendor"
          element={
            <ProtectedRoute role="vendor">
              <VendorDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboardPage />} />
          <Route path="profile" element={<VendorProfilePage />} />
          <Route path="services" element={<ServiceManagementPage />} />
          <Route path="services/create" element={<ServiceCreatePage />} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
          <Route path="services/:id/edit" element={<ServiceEditPage />} />
          <Route path="quotation-requests" element={<QuotationRequestsPage />} />
          <Route path="quotation-requests/:id" element={<QuotationRequestDetailPage />} />
          <Route path="quotation-requests/:id/create-quotation" element={<CreateQuotationPage />} />
          <Route path="bookings" element={<BookingManagementPage />} />
          <Route path="bookings/:id" element={<VendorBookingDetailPage />} />
          <Route path="messages" element={<VendorMessagesPage />} />
          <Route path="reviews" element={<VendorReviewsPage />} />
          <Route path="notifications" element={<VendorNotificationsPage />} />
          <Route path="settings" element={<VendorSettingsPage />} />
          <Route path="settings/change-password" element={<VendorChangePasswordPage />} />
        </Route>
      </Routes>

      {backgroundLocation ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterChoicePage />} />
          <Route path="/register/customer" element={<CustomerRegisterPage />} />
          <Route path="/register/vendor" element={<VendorRegisterPage />} />
        </Routes>
      ) : null}
    </>
  );
}
