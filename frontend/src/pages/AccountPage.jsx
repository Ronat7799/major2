import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <header className="ui-yellow">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <p className="text-xl font-bold text-black">ReabJom</p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-[#F5C400]"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">Welcome, {user.full_name}</h1>
          <dl className="mt-6 grid gap-3 text-sm">
            <div>
              <dt className="text-black/50">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-black/50">Role</dt>
              <dd className="font-medium capitalize">{user.role}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
