import { Outlet } from 'react-router-dom';
import VendorSidebar from '../components/vendor/VendorSidebar.jsx';
import VendorTopbar from '../components/vendor/VendorTopbar.jsx';

export default function VendorDashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f6]">
      <VendorSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <VendorTopbar />
        <main className="flex-1 px-10 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
