export async function exportParticipants(seminarId: string) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('jusa_token');
  const response = await fetch(`${base}/admin/seminars/${seminarId}/export`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error('Unable to export participants.');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a'); link.href = url; link.download = 'jusa-participants.xlsx'; link.click(); URL.revokeObjectURL(url);
}
