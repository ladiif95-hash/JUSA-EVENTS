import { AlertCircle, CalendarDays, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoadingState({ label = 'Loading…', kind = 'cards' }: { label?: string; kind?: 'cards' | 'table' }) {
  return <div className={`loading-state loading-${kind}`} aria-label={label} aria-busy="true">
    <span className="sr-only">{label}</span><i /><i /><i />
  </div>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: { to: string; label: string } }) {
  return <section className="empty-state"><Inbox aria-hidden="true" /><h2>{title}</h2><p>{message}</p>{action && <Link className="button" to={action.to}><CalendarDays />{action.label}</Link>}</section>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <section className="error-state" role="alert"><AlertCircle aria-hidden="true" /><div><b>Unable to load this content</b><p>{message}</p></div>{retry && <button className="button button-small" onClick={retry}>Try again</button>}</section>;
}
