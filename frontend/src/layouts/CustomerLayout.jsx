import { Outlet, useLocation } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar.jsx';
import CustomerFooter from '../components/customer/CustomerFooter.jsx';

export default function CustomerLayout() {
  const location = useLocation();
  const hideFooter = location.pathname === '/vendors';

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CustomerNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {hideFooter ? null : <CustomerFooter />}
    </div>
  );
}
