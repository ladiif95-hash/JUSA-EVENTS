import { useEffect, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { categories } from '../types/seminar.types';
import { seminarService } from '../services/seminar.service';

const empty = {
  title: '',
  shortDescription: '',
  description: '',
  category: 'Technology',
  speaker: '',
  speakerPosition: '',
  venue: 'JUST Main Campus Hall',
  startDateTime: '',
  endDateTime: '',
  capacity: 120,
  coverImage: '',
  status: 'PUBLISHED',
};

export default function AdminSeminarForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof empty, value: string | number) => setForm((current) => ({ ...current, [key]: value }));

  const chooseCoverImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, WebP, or GIF).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Cover image must be 2 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set('coverImage', String(reader.result || ''));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!id) return;
    seminarService.adminList().then((response) => {
      const source = response.data.find((item) => item.id === id || (item as typeof item & { _id?: string })._id === id);
      if (!source) return setError('Seminar not found.');
      setForm({ title: source.title || '', shortDescription: source.shortDescription || '', description: source.description || '', category: source.category || 'Technology', speaker: source.speaker || '', speakerPosition: source.speakerPosition || '', venue: source.venue || '', startDateTime: source.startDateTime ? source.startDateTime.slice(0, 16) : '', endDateTime: source.endDateTime ? source.endDateTime.slice(0, 16) : '', capacity: source.capacity || 1, coverImage: source.coverImage || source.image || '', status: source.status || 'PUBLISHED' });
    }).catch((issue) => setError(issue instanceof Error ? issue.message : 'Unable to load this seminar.'));
  }, [id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (id) await seminarService.update(id, {
        ...form,
        capacity: Number(form.capacity),
      }); else await seminarService.create({
        ...form,
        capacity: Number(form.capacity),
      });
      navigate('/admin/seminars');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to create seminar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-page">
      <span className="eyebrow">SEMINAR MANAGEMENT</span>
      <h1>{id ? 'Edit seminar' : 'Create seminar'}</h1>
      <p className="admin-lead">{id ? 'Update the event details students and staff rely on.' : 'Publish a new JUSA event. Students will see it immediately if status is Published.'}</p>
      <form className="admin-panel profile-form seminar-form" onSubmit={submit}>
        <label>Title<input required value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="Cybersecurity Awareness Seminar" /></label>
        <label>Category
          <select value={form.category} onChange={(event) => set('category', event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="full">Short description<input required value={form.shortDescription} onChange={(event) => set('shortDescription', event.target.value)} placeholder="One-line summary for cards" /></label>
        <label className="full">Full description<textarea required rows={5} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="What students will learn" /></label>
        <label>Speaker<input value={form.speaker} onChange={(event) => set('speaker', event.target.value)} placeholder="Abdirahman Hassan" /></label>
        <label>Speaker title<input value={form.speakerPosition} onChange={(event) => set('speakerPosition', event.target.value)} placeholder="Cybersecurity Specialist" /></label>
        <label>Venue<input required value={form.venue} onChange={(event) => set('venue', event.target.value)} /></label>
        <label>Capacity<input required type="number" min={1} value={form.capacity} onChange={(event) => set('capacity', Number(event.target.value))} /></label>
        <label>Starts<input required type="datetime-local" value={form.startDateTime} onChange={(event) => set('startDateTime', event.target.value)} /></label>
        <label>Ends<input type="datetime-local" value={form.endDateTime} onChange={(event) => set('endDateTime', event.target.value)} /></label>
        <div className="full cover-image-field">
          <div className="cover-field-heading">
            <div><b>Cover image</b><span>Upload a JPG, PNG, WebP, or GIF (up to 2 MB).</span></div>
            {form.coverImage && <button type="button" className="cover-remove" onClick={() => set('coverImage', '')}><Trash2/>Remove</button>}
          </div>
          {form.coverImage ? <div className="cover-preview-wrap"><img className="cover-preview" src={form.coverImage} alt="Selected cover preview" /><label className="cover-replace"><Upload/>Replace image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseCoverImage}/></label></div> : <label className="cover-upload"><ImagePlus/><b>Add cover image</b><span>Choose a file from your computer</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseCoverImage}/><em><Upload/>Select image</em></label>}
          <label className="cover-url-label">Or paste an image URL<input value={form.coverImage.startsWith('data:') ? '' : form.coverImage} onChange={(event) => set('coverImage', event.target.value)} placeholder="https://example.com/event-cover.jpg" /></label>
        </div>
        <label>Status
          <select value={form.status} onChange={(event) => set('status', event.target.value)}>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
        {error && <div className="status-bar status-bar-fail full"><b>{error}</b></div>}
        <div className="form-actions full">
          <Link className="button button-outline" to="/admin/seminars">Cancel</Link>
          <button className="button" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Create seminar'}</button>
        </div>
      </form>
    </section>
  );
}
