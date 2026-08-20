import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertTriangle, Camera, CheckCircle2, Mail, Phone, ShieldCheck, UserRound, X } from 'lucide-react';
import { api } from '../services/api';

type ScanResult = {
  alreadyCheckedIn?: boolean;
  attendance: { status: string; checkedInAt?: string };
  student: { fullName: string; email: string; phone?: string; faculty?: string; department?: string; semester?: string; gender?: string };
  seminar: { title: string; venue?: string };
  registration: { reference?: string; status?: string };
};

export default function AdminCheckIn() {
  const [qrToken, setQrToken] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const scanner = useRef<Html5Qrcode | null>(null);

  const stopCamera = async () => {
    const active = scanner.current;
    scanner.current = null;
    setCameraOpen(false);
    if (active?.isScanning) await active.stop().catch(() => undefined);
    active?.clear();
  };

  const verifyTicket = async (rawValue: string) => {
    const value = rawValue.trim();
    if (!value || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await api<{ data: ScanResult }>('/admin/check-in/qr', { method: 'POST', body: JSON.stringify({ qrToken: value }) });
      setResult(response.data);
      setQrToken('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'This QR pass could not be verified.');
    } finally {
      setBusy(false);
    }
  };

  const startCamera = async () => {
    setError('');
    setCameraOpen(true);
    window.setTimeout(async () => {
      try {
        const reader = new Html5Qrcode('jusa-qr-reader');
        scanner.current = reader;
        await reader.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            await stopCamera();
            setQrToken(decodedText);
            void verifyTicket(decodedText);
          },
          () => undefined,
        );
      } catch {
        setCameraOpen(false);
        setError('Unable to open the camera. Allow camera access, or paste the QR token instead.');
      }
    }, 0);
  };

  useEffect(() => () => { void stopCamera(); }, []);

  return <section className="admin-page">
    <span className="eyebrow">EVENT ATTENDANCE</span>
    <h1>Check in attendee</h1>
    <p className="admin-lead">Scan the student QR pass or paste its code. A valid ticket records attendance and shows the registration profile.</p>

    <div className="scan-layout">
      <div className="admin-panel scan-panel">
        {cameraOpen ? <div className="qr-scanner-wrap"><div id="jusa-qr-reader" className="qr-scanner" /><button type="button" className="scan-camera-stop" onClick={() => void stopCamera()}><X/>Stop camera</button></div> : <button type="button" className="button scan-camera-button" onClick={() => void startCamera()}><Camera/>Scan with camera</button>}
        <div className="scan-divider"><span>or enter code manually</span></div>
        <form className="scan-manual" onSubmit={(event) => { event.preventDefault(); void verifyTicket(qrToken); }}>
          <label>QR token<input autoFocus value={qrToken} onChange={(event) => setQrToken(event.target.value)} placeholder="Paste QR token…" /></label>
          <button className="button" disabled={busy}>{busy ? 'Checking…' : 'Verify ticket'}</button>
        </form>
      </div>

      <div className="scan-result-col">
        {error && <div className="status-bar status-bar-fail" role="alert"><AlertTriangle /><div><b>Check-in failed</b><span>{error}</span></div></div>}
        {result && <>
          <div className={result.alreadyCheckedIn ? 'status-bar status-bar-warn' : 'status-bar status-bar-ok'}>
            {result.alreadyCheckedIn ? <AlertTriangle /> : <CheckCircle2 />}<div><b>{result.alreadyCheckedIn ? 'Already checked in' : 'Check-in successful'}</b><span>{result.alreadyCheckedIn ? 'This student was already marked present.' : 'Attendance has been recorded.'}</span></div>
          </div>
          <article className="student-card">
            <div className="student-card-head"><div className="student-avatar"><UserRound /></div><div><small>REGISTERED STUDENT</small><h2>{result.student.fullName}</h2><p>{result.seminar.title}</p></div><span className="pill">{result.alreadyCheckedIn ? 'PRESENT' : 'CHECKED IN'}</span></div>
            <div className="student-grid">
              <p><Mail /><span><b>Email</b>{result.student.email || '—'}</span></p><p><Phone /><span><b>Phone</b>{result.student.phone || '—'}</span></p><p><ShieldCheck /><span><b>Faculty</b>{result.student.faculty || '—'}</span></p><p><UserRound /><span><b>Department</b>{result.student.department || '—'}</span></p><p><span><b>Class / semester</b>{result.student.semester || '—'}</span></p><p><span><b>Gender</b>{result.student.gender || '—'}</span></p>
            </div>
            {result.registration.reference && <p className="student-ref">Reference {result.registration.reference}</p>}
          </article>
        </>}
        {!error && !result && <article className="student-card student-card-empty"><ShieldCheck /><h2>Waiting for a ticket</h2><p>After scanning, the attendee name, phone, faculty, department, class and gender will appear here.</p></article>}
      </div>
    </div>
  </section>;
}
