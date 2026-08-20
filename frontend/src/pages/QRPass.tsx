import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EventTicket from '../components/EventTicket';
import { seminarService } from '../services/seminar.service';

type PassData = {
  dataUrl: string;
  registration: {
    reference?: string;
    seminarId?: { title?: string; venue?: string; startDateTime?: string; endDateTime?: string };
    userId?: { fullName?: string };
  };
};

function formatDate(value?: string) {
  if (!value) return 'To be confirmed';
  return new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(start?: string) {
  if (!start) return 'TBC';
  return new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function QRPass() {
  const { registrationId } = useParams();
  const [pass, setPass] = useState<PassData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!registrationId) return;
    seminarService.qr(registrationId).then(setPass).catch((issue) => setError(issue instanceof Error ? issue.message : 'QR pass is unavailable'));
  }, [registrationId]);

  if (error) {
    return (
      <section className="page container">
        <h1>QR pass unavailable</h1>
        <div className="status-bar status-bar-fail">{error}</div>
        <Link to="/my-events" className="text-link">Back to my events</Link>
      </section>
    );
  }
  if (!pass) return <section className="page container"><h1>Loading your ticket…</h1></section>;

  const seminar = pass.registration.seminarId;

  return (
    <section className="page container ticket-page">
      <EventTicket
        ticket={{
          title: seminar?.title || 'JUSA Event',
          date: formatDate(seminar?.startDateTime),
          time: formatTime(seminar?.startDateTime),
          venue: seminar?.venue || 'JUST campus',
          attendee: pass.registration.userId?.fullName || 'JUSA Student',
          dataUrl: pass.dataUrl,
        }}
      />
      <Link to="/my-events" className="text-link">Back to my events</Link>
    </section>
  );
}
