import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Shield, Sparkles, Users } from 'lucide-react';
import EventTicket, { type EventTicketData } from '../components/EventTicket';
import Modal from '../components/Modal';
import { seminars } from '../data/seminars';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import { mapSeminar, seminarService } from '../services/seminar.service';
import type { Seminar } from '../types/seminar.types';

export default function SeminarDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [ticket, setTicket] = useState<EventTicketData | null>(null);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    faculty: user?.faculty || '',
    department: user?.department || '',
    semester: user?.semester || '',
    gender: user?.gender || '',
  });

  useEffect(() => {
    if (!slug) return;
    seminarService.get(slug)
      .then((response) => {
        const mapped = mapSeminar(response.data);
        setSeminar(mapped);
        if (mapped.myRegistration?.status === 'REGISTERED') {
          setReserved(true);
          const existingId = mapped.myRegistration.id;
          if (existingId) {
            seminarService.qr(existingId).then((pass) => {
              setTicket({
                title: mapped.title,
                date: mapped.date,
                time: mapped.time.split('–')[0].trim(),
                venue: mapped.venue,
                attendee: user?.fullName || pass.registration.userId?.fullName || 'JUSA Student',
                dataUrl: pass.dataUrl,
              });
            }).catch(() => undefined);
          }
        }
      })
      .catch(() => setSeminar(seminars.find((item) => item.slug === slug) || null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <section className="page container"><h1>Loading seminar…</h1></section>;
  if (!seminar) return <section className="page container"><h1>Seminar not found</h1></section>;

  const remaining = seminar.remainingSeats ?? seminar.capacity - seminar.reserved;
  const openReservation = () => {
    if (!user) {
      navigate('/login', { state: { from: `/seminars/${seminar.slug}` } });
      return;
    }
    setModal(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await authService.updateProfile({ fullName: form.fullName, phone: form.phone, faculty: form.faculty, department: form.department, semester: form.semester, gender: form.gender });
      const created = await seminarService.register(seminar.id);
      const registrationId = created.data.id || (created.data as { _id?: string })._id;
      setReserved(true);
      setModal(false);
      if (created.data.status !== 'WAITLISTED' && registrationId) {
        const pass = await seminarService.qr(registrationId);
        setTicket({
          title: seminar.title,
          date: seminar.date,
          time: seminar.time.split('–')[0].trim(),
          venue: seminar.venue,
          attendee: form.fullName,
          dataUrl: pass.dataUrl,
        });
        setTicketOpen(true);
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to reserve your seat');
    }
  };

  const highlights = [
    'Practical steps you can use the same day',
    'Live examples tailored for JUST students',
    'Time to ask questions and meet the speaker',
  ];

  return (
    <section className="page container">
      <div className="detail-hero">
        <img src={seminar.image} alt="" />
        <div className="detail-title">
          <span className="pill">{seminar.category}</span>
          <h1>{seminar.title}</h1>
          <p>Hosted by Jamhuriya University Students Association</p>
          <div className="hero-meta">
            <span><CalendarDays /> {seminar.date}</span>
            <span><Clock3 /> {seminar.time}</span>
            <span><MapPin /> {seminar.venue}</span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <article className="detail-content">
          <div className="detail-block">
            <span className="eyebrow">ABOUT THIS SEMINAR</span>
            <h2>What you will take away</h2>
            <p>{seminar.description}</p>
            <ul className="detail-highlights">
              {highlights.map((item) => (
                <li key={item}><Sparkles /> {item}</li>
              ))}
            </ul>
          </div>

          <div className="detail-facts">
            <div>
              <CalendarDays />
              <b>Date</b>
              <span>{seminar.date}</span>
            </div>
            <div>
              <Clock3 />
              <b>Time</b>
              <span>{seminar.time}</span>
            </div>
            <div>
              <MapPin />
              <b>Venue</b>
              <span>{seminar.venue}</span>
            </div>
            <div>
              <Users />
              <b>Capacity</b>
              <span>{seminar.capacity} seats</span>
            </div>
          </div>

          <div className="speaker-card">
            <div className="speaker-avatar">{seminar.speaker.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
            <div>
              <small>FEATURED SPEAKER</small>
              <b>{seminar.speaker}</b>
              <span>{seminar.speakerPosition}</span>
            </div>
            <Shield />
          </div>
        </article>

        <aside className="reserve-card">
          <span className="eyebrow">REGISTRATION</span>
          <h2>{remaining ? `${remaining} seats remaining` : 'This seminar is full'}</h2>
          <div className="progress"><i style={{ width: `${Math.min(100, (seminar.reserved / seminar.capacity) * 100)}%` }} /></div>
          <p>{seminar.reserved} of {seminar.capacity} seats reserved</p>
          {reserved ? (
            <div className="success-box">
              <CheckCircle2 />
              <b>Your seat is reserved!</b>
              <span>Your QR pass is ready in My Events.</span>
              <button className="button" onClick={() => ticket ? setTicketOpen(true) : navigate('/my-events')}>View ticket</button>
            </div>
          ) : (
            <button className="button reserve" onClick={openReservation}>{remaining ? 'Reserve my seat' : 'Join waitlist'}</button>
          )}
          <small>Registration closes 2 hours before the event begins.</small>
        </aside>
      </div>

      {modal && (
        <Modal title="Your registration details" onClose={() => setModal(false)}>
          <form className="registration-form" onSubmit={submit}>
            <p className="registration-intro">Review your profile details before reserving a place for <strong>{seminar.title}</strong>.</p>
            <div className="registration-fields">
              <label>Full name<input required autoComplete="name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
              <label>Email<input required disabled aria-describedby="email-note" value={form.email} /></label>
              <label>Phone number<input required type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+252 61 0000000" /></label>
              <label>Faculty<input required value={form.faculty} onChange={(event) => setForm({ ...form, faculty: event.target.value })} /></label>
              <label>Department<input required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label>
              <label>Class / semester<input required value={form.semester} onChange={(event) => setForm({ ...form, semester: event.target.value })} /></label>
              <label>Gender
                <select required value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </div>
            <small id="email-note" className="registration-note">Your email is linked to your account and cannot be changed here.</small>
            {error && <div className="status-bar status-bar-fail" role="alert">{error}</div>}
            <div className="registration-actions">
              <button className="button button-outline" type="button" onClick={() => setModal(false)}>Cancel</button>
              <button className="button" type="submit">Confirm reservation</button>
            </div>
          </form>
        </Modal>
      )}
      {ticketOpen && ticket && (
        <div className="ticket-backdrop" role="presentation">
          <EventTicket ticket={ticket} onClose={() => setTicketOpen(false)} />
        </div>
      )}
    </section>
  );
}
