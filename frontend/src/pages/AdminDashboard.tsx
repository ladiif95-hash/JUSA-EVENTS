import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, CheckCircle2, ClipboardList, Crown, PieChart, QrCode, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mapSeminar, seminarService, type DashboardData } from '../services/seminar.service';
import type { Seminar } from '../types/seminar.types';
import { ErrorState, LoadingState } from '../components/StateViews';

const SEMESTER_COLORS = ['#0a8f55', '#2563eb', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#ca8a04', '#4f46e5', '#db2777', '#059669'];

export default function AdminDashboard() {
  const [items, setItems] = useState<Seminar[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      seminarService.adminList(),
      seminarService.dashboard(),
    ])
      .then(([seminarsRes, dashRes]) => {
        setItems(seminarsRes.data.map(mapSeminar));
        setDashboardData(dashRes.data);
      })
      .catch((issue) => setError(issue instanceof Error ? issue.message : 'Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <section className="admin-page"><LoadingState /></section>;
  if (error) return <section className="admin-page"><ErrorState message={error} retry={load} /></section>;

  const totalRegistrations = dashboardData?.registrations ?? items.reduce((sum, item) => sum + (item.reserved || item.registered || 0), 0);
  const totalCapacity = items.reduce((sum, item) => sum + item.capacity, 0);
  const totalAttendance = dashboardData?.attendance ?? 0;
  const totalWaitlisted = dashboardData?.waitlisted ?? items.reduce((sum, item) => sum + (item.waitlisted || 0), 0);

  const cards = [
    ['Total seminars', String(items.length), CalendarDays, '#087346'],
    ['Registrations', String(totalRegistrations), Users, '#2563eb'],
    ['Attended / Checked-in', String(totalAttendance), CheckCircle2, '#0a8f55'],
    ['Waitlisted', String(totalWaitlisted), ClipboardList, '#d97706'],
  ] as const;

  const semesterStats = dashboardData?.semesterStats || [];
  const topSemester = semesterStats[0];

  const genderStats = dashboardData?.genderStats || [];
  const maleStat = genderStats.find((g) => g.gender === 'Male' || g.rawGender === 'MALE') || { gender: 'Male', count: 0, percentage: 0 };
  const femaleStat = genderStats.find((g) => g.gender === 'Female' || g.rawGender === 'FEMALE') || { gender: 'Female', count: 0, percentage: 0 };
  const totalGenderCount = maleStat.count + femaleStat.count;
  const malePercentage = totalGenderCount > 0 ? Math.round((maleStat.count / totalGenderCount) * 100) : 0;
  const femalePercentage = totalGenderCount > 0 ? Math.round((femaleStat.count / totalGenderCount) * 100) : 0;

  return (
    <section className="admin-page">
      <div className="admin-title">
        <div>
          <span className="eyebrow">ADMIN OVERVIEW</span>
          <h1>Dashboard</h1>
          <p className="admin-lead">A clear view of current JUSA seminars, registrations, and student demographics.</p>
        </div>
        <div className="admin-actions">
          <Link className="button button-outline" to="/admin/check-in"><QrCode />Check-in</Link>
          <Link className="button" to="/admin/seminars/new">Create seminar</Link>
        </div>
      </div>

      {/* Top Metric Grid */}
      <div className="metric-grid">
        {cards.map(([label, value, Icon, iconColor]) => (
          <article key={label}>
            <Icon style={{ color: iconColor }} />
            <span>{label}</span>
            <b>{value}</b>
          </article>
        ))}
      </div>

      {/* Visual Charts Section (Semester & Gender Demographics) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginTop: 24 }}>

        {/* Chart 1: Semester Participation */}
        <div className="admin-panel" style={{ marginTop: 0 }}>
          <div className="panel-head">
            <div>
              <span className="eyebrow">STUDENT PARTICIPATION</span>
              <h2><BarChart3 style={{ verticalAlign: 'middle', marginRight: 6 }} /> Semesters with Most Applications</h2>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13, border: 0, padding: 0 }}>
                Which semester applied the most across all seminars.
              </p>
            </div>
          </div>

          {topSemester && topSemester.count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef3c7', borderRadius: 10, margin: '14px 0 16px', color: '#92400e', fontSize: 13, fontWeight: 600 }}>
              <Crown style={{ width: 18, color: '#d97706', flexShrink: 0 }} />
              <span>Leading: <b>{topSemester.semester}</b> with <b>{topSemester.count}</b> applicants ({topSemester.percentage}%)</span>
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {semesterStats.length > 0 ? (
              semesterStats.map((item, idx) => {
                const color = SEMESTER_COLORS[idx % SEMESTER_COLORS.length];
                const isTop = idx === 0 && item.count > 0;

                return (
                  <div
                    key={item.semester}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: isTop ? '#f0fdf4' : '#f9fafb',
                      border: `1px solid ${isTop ? '#86efac' : '#e5e7eb'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                        <b style={{ fontSize: 14, color: '#111827' }}>{item.semester}</b>
                        {isTop && (
                          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                            #1 Top
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: color }}>
                        {item.count} student{item.count === 1 ? '' : 's'} ({item.percentage}%)
                      </span>
                    </div>
                    <div style={{ height: 8, width: '100%', background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(item.percentage, item.count > 0 ? 4 : 0)}%`,
                          background: color,
                          borderRadius: 'inherit',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No semester application data available yet.
              </p>
            )}
          </div>
        </div>

        {/* Chart 2: Gender Demographics */}
        <div className="admin-panel" style={{ marginTop: 0 }}>
          <div className="panel-head">
            <div>
              <span className="eyebrow">GENDER DEMOGRAPHICS</span>
              <h2><PieChart style={{ verticalAlign: 'middle', marginRight: 6 }} /> Male vs Female Applicants</h2>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13, border: 0, padding: 0 }}>
                Comparison of male and female students across registrations.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            {/* Male Card */}
            <div style={{ padding: '16px', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                👨 Male Students
              </span>
              <b style={{ display: 'block', fontSize: 32, color: '#1e3a8a', margin: '6px 0 2px' }}>
                {maleStat.count}
              </b>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                {malePercentage}% of applicants
              </span>
            </div>

            {/* Female Card */}
            <div style={{ padding: '16px', borderRadius: 12, background: '#fdf2f8', border: '1px solid #fbcfe8', textAlign: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#9d174d', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                👩 Female Students
              </span>
              <b style={{ display: 'block', fontSize: 32, color: '#831843', margin: '6px 0 2px' }}>
                {femaleStat.count}
              </b>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#db2777' }}>
                {femalePercentage}% of applicants
              </span>
            </div>
          </div>

          {/* Visual Dual-Proportion Comparison Bar */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
              <span style={{ color: '#2563eb' }}>Male ({malePercentage}%)</span>
              <span style={{ color: '#db2777' }}>Female ({femalePercentage}%)</span>
            </div>
            <div style={{ height: 18, width: '100%', borderRadius: 99, overflow: 'hidden', display: 'flex', background: '#e5e7eb' }}>
              {malePercentage > 0 && (
                <div
                  style={{
                    width: `${malePercentage}%`,
                    background: '#2563eb',
                    height: '100%',
                    transition: 'width 0.5s ease',
                  }}
                  title={`Male: ${maleStat.count} (${malePercentage}%)`}
                />
              )}
              {femalePercentage > 0 && (
                <div
                  style={{
                    width: `${femalePercentage}%`,
                    background: '#db2777',
                    height: '100%',
                    transition: 'width 0.5s ease',
                  }}
                  title={`Female: ${femaleStat.count} (${femalePercentage}%)`}
                />
              )}
            </div>
          </div>

          {/* Insight Callout */}
          <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475467' }}>
            <TrendingUp style={{ width: 16, color: '#087346', flexShrink: 0 }} />
            <span>
              {totalGenderCount > 0 ? (
                malePercentage > femalePercentage ? (
                  <><b>Male students</b> represent the majority of seminar registrations (<b>{malePercentage}%</b>).</>
                ) : femalePercentage > malePercentage ? (
                  <><b>Female students</b> represent the majority of seminar registrations (<b>{femalePercentage}%</b>).</>
                ) : (
                  <>Registrations are evenly split between male and female students (<b>50% / 50%</b>).</>
                )
              ) : (
                <>No demographic registration data recorded yet.</>
              )}
            </span>
          </div>
        </div>

      </div>

      {/* Seminars List & Manage Link */}
      <div className="admin-panel" style={{ marginTop: 24 }}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">ALL EVENTS</span>
            <h2>Seminars Overview</h2>
          </div>
          <Link className="text-link" to="/admin/seminars">Manage all seminars &rarr;</Link>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Seminar</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Registrations</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 6).map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.title}</b>
                    <small>{item.category}</small>
                  </td>
                  <td>{item.date}</td>
                  <td>{item.venue}</td>
                  <td>{item.reserved || item.registered || 0} / {item.capacity}</td>
                  <td>
                    <span className="pill">{item.status || 'Published'}</span>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
                    No seminars yet. Create the first JUSA event.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

