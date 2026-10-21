import React, { useEffect, useState } from 'react';
import { nssStatus, nssTasks, nssMyRegistrations, nssMyHours, nssRegisterForTask } from '../services/apiService';

export default function NssVolunteerDashboard({ currentUser, onBack, onOpenTask }) {
  const [status, setStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [hours, setHours] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const email = currentUser?.email;

  const load = async () => {
    setLoading(true);
    try {
      const [s, t, r, h] = await Promise.all([
        nssStatus(email),
        nssTasks(false),
        nssMyRegistrations(email).catch(() => ({ data: [] })),
        nssMyHours(email).catch(() => ({ data: null }))
      ]);
      setStatus(s.data);
      setTasks(t.data || []);
      setMyRegs(r.data || []);
      setHours(h.data);
    } catch {
      // handled by empty states below
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = status?.state || 'NOT_REGISTERED';

  const register = async (task) => {
    setMsg(null);
    try {
      await nssRegisterForTask(task.id);
      setMsg({ type: 'success', text: `Registered for “${task.title}”.` });
      await load();
    } catch (err) {
      setMsg({ type: 'danger', text: err?.response?.data?.message || 'Could not register.' });
    }
  };

  const registeredTaskIds = new Set(myRegs.map((r) => r.registration?.taskId));

  if (!currentUser) {
    return (
      <div className="feature-shell"><div className="form-card text-center py-5">Sign in to view your dashboard.</div></div>
    );
  }

  if (loading) {
    return <div className="feature-shell"><div className="form-card py-5 text-center">Loading dashboard…</div></div>;
  }

  if (state !== 'APPROVED') {
    return (
      <div className="feature-shell">
        <div className="form-card text-center py-5">
          <i className="bi bi-hourglass-split fs-1 text-warning d-block"></i>
          <h4 className="fw-bold mt-3">Volunteer access only</h4>
          <p className="text-muted mb-3">
            {state === 'PENDING' ? 'Your application is under review — check back soon.'
              : state === 'REJECTED' ? 'Your most recent application was rejected. See the application page for the note.'
              : 'You are not registered as an NSS volunteer yet.'}
          </p>
          <button type="button" className="btn btn-primary-evege" onClick={onBack}>NSS Overview</button>
        </div>
      </div>
    );
  }

  const upcoming = tasks
    .filter((t) => t.status === 'PUBLISHED')
    .sort((a, b) => String(a.taskDate).localeCompare(String(b.taskDate)));

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to NSS
      </button>

      <div className="feature-hero mb-3">
        <h2>Welcome, {status?.application?.fullName || currentUser.fullName || 'Volunteer'} 👋</h2>
        <p>Approved NSS volunteer dashboard — tasks, attendance and verified service hours.</p>
      </div>

      <div className="feature-stats">
        <div className="feature-stat"><div className="num">{hours?.verifiedHours ?? 0}</div><div className="lbl">Verified hours</div></div>
        <div className="feature-stat"><div className="num">{hours?.pendingVerificationHours ?? 0}</div><div className="lbl">Pending verification</div></div>
        <div className="feature-stat"><div className="num">{hours?.scheduledHours ?? 0}</div><div className="lbl">Scheduled hours</div></div>
        <div className="feature-stat"><div className="num">{hours?.completedTasks ?? 0}</div><div className="lbl">Completed tasks</div></div>
      </div>

      {msg && <div className={`alert alert-${msg.type} py-2 small`}>{msg.text}</div>}

      <h5 className="fw-bold mb-2"><i className="bi bi-list-task me-2 text-primary"></i>Upcoming service opportunities</h5>
      {upcoming.length === 0 ? (
        <div className="form-card text-center text-muted py-4">No published tasks yet — check back soon.</div>
      ) : (
        upcoming.map((t) => {
          const reg = myRegs.find((r) => r.registration?.taskId === t.id)?.registration;
          return (
            <div key={t.id} className="task-card">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <h5>{t.title}</h5>
                  <div className="task-meta">
                    <span><i className="bi bi-calendar3"></i>{t.taskDate}</span>
                    <span><i className="bi bi-clock"></i>{t.startTime}–{t.endTime}</span>
                    <span><i className="bi bi-geo-alt"></i>{t.location}</span>
                    <span><i className="bi bi-hourglass"></i>{t.expectedHours} h</span>
                  </div>
                  <div className="task-chips">
                    <span className="chip">{(t.serviceCategory || 'OTHER').replace('_', ' ')}</span>
                    <span className={`chip ${t.travelAssistance ? 'yes' : 'no'}`}>Travel: {t.travelAssistance ? 'Provided' : 'Self'}</span>
                    <span className={`chip ${t.accommodationProvided ? 'yes' : 'no'}`}>Stay: {t.accommodationProvided ? 'Yes' : 'No'}</span>
                    {reg && <span className="chip yes">{reg.attendanceStatus === 'PRESENT' && reg.verificationStatus === 'VERIFIED' ? 'Hours verified' : reg.attendanceStatus}</span>}
                  </div>
                  {t.instructions && <p className="text-muted small mb-2">{t.instructions}</p>}
                </div>
                <div className="text-end">
                  <button type="button" className="btn btn-ghost-evege btn-sm-evege mb-2" onClick={() => onOpenTask(t)}>
                    Details
                  </button>
                  <div>
                    {reg ? (
                      <span className="chip yes">Registered</span>
                    ) : (
                      <button type="button" className="btn btn-primary-evege btn-sm-evege" onClick={() => register(t)}>
                        Register
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <h5 className="fw-bold mt-4 mb-2"><i className="bi bi-journal-check me-2 text-success"></i>My participation history</h5>
      {myRegs.length === 0 ? (
        <div className="form-card text-center text-muted py-4">No task registrations yet.</div>
      ) : (
        <table className="leader-table">
          <thead><tr><th>Task</th><th>Date</th><th>Attendance</th><th>Verified hours</th></tr></thead>
          <tbody>
            {myRegs.map((r) => (
              <tr key={r.registration.id}>
                <td>{r.task?.title || `#${r.registration.taskId}`}</td>
                <td>{r.task?.taskDate || '—'}</td>
                <td>{r.registration.attendanceStatus}</td>
                <td>{r.registration.verifiedHours ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
