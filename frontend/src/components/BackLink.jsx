import { Link } from 'react-router-dom';

export default function BackLink({ to, state }) {
  return (
    <Link to={to} state={state} className="ui-yellow-text mb-5 inline-flex items-center gap-1 text-sm font-medium">
      <span aria-hidden="true">←</span> Back
    </Link>
  );
}
