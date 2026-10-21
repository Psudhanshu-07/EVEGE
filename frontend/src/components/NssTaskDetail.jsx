import React, { useEffect, useState } from 'react';
import { nssTask, nssRegisterForTask, nssTaskRegistrations, nssMarkAttendance, nssVerifyHours, nssMyRegistrations } from '../services/apiService';

export default function NssTaskDetail({ currentUser, taskId, onBack }) {
  const [task, setTask] = useState(null);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [myReg, setMyReg] = useState(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const load = async () => {
    try {
      const r = await nssTask(taskId);
      setTask(r.data);
      if (isAdmin) {
        const regs = await nssTaskRegistrations(taskId);
        setRoster(regs.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Task unavailable.');
    }
  };

  useEffect(() => { load(); }, [taskId, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // My own registration state (volunteer view)
    if (!currentUser || isAdmin) return;
    nssMyRegistrations(currentUser.email)
      .then((r) => setMyReg((r.data || []).find((x) => x.registration?.taskId === Number(taskId))?.registration || null))
      .catch(() => {});
  }, [currentUser, taskId, isAdmin, roster.length]);

  const register = async () => {
    setMsg(null);
    try {
      await nssRegisterForTask(taskId);
      setMsg({ type: 'success', text: 'Registered! See you at the task.' });
      await load();
    } catch (err) {
      setMsg({ type: 'danger', text: err?.response?.data?.message || 'Could not register.' });
    }
  };

  const markAttendance = async (volunteerEmail, attendance) => {
    try {
      await nssMarkAttendance(taskId, volunteerEmail, attendance);
      await load();
    } catch (err) {
      setMsg({ type: 'danger', text: err?.response?.data?.message || 'Failed.' });
    }
  };

  const verifyHours = async (volunteerEmail, actualHours) => {
    try {
      await nssVerifyHours(taskId, volunteerEmail, Number(actualHours));
      await load();
    } catch (err) {
      setMsg({ type: 'danger', text: err?.response?.data?.message || 'Failed.' });
    }
  };

  if (error) {
    return <div className="feature-shell"><div className="form-card text-center py-5">{error}</div></div>;
  }

  if (!task) {
    return <div className="feature-shell"><div className="form-card py-5 text-center">Loading task…</div></div>;
  }

  const isApprovedVolunteer = !isAdmin && currentUser && myReg !== undefined;

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
      </button>

      <div className="feature-hero mb-4">
        <h2>{task.title}</h2>
        <p>{task.description}</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="form-card">
            <div className="task-meta">
              <span><i className="bi bi-calendar3"></i>{task.taskDate}</span>
              <span><i className="bi bi-clock"></i>{task.startTime} – {task.endTime}</span>
              <span><i className="bi bi-geo-alt"></i>{task.location}</span>
            </div>
            <div className="task-chips">
              <span className="chip">{(task.serviceCategory || 'OTHER').replace('_', ' ')}</span>
              <span className="chip">Expected {task.expectedHours} h</span>
              <span className={`chip ${task.travelAssistance ? 'yes' : 'no'}`}>Travel: {task.travelAssistance ? 'Provided' : 'Self'}</span>
              <span className={`chip ${task.accommodationProvided ? 'yes' : 'no'}`}>Accommodation: {task.accommodationProvided ? 'Yes' : 'No'}</span>
            </div>
            {task.eligibility && <p className="mb-2"><strong>Eligibility:</strong> {task.eligibility}</p>}
            {task.instructions && <p className="mb-2"><strong>Instructions:</strong> {task.instructions}</p>}
            {task.registrationDeadline && <p className="mb-2"><strong>Registration deadline:</strong> {task.registrationDeadline}</p>}

            {msg && <div className={`alert alert-${msg.type} py-2 small`}>{msg.text}</div>}

            {!isAdmin && isApprovedVolunteer && (
              <div>
                {myReg ? (
                  <span className="chip yes">You are registered — attendance: {myReg.attendanceStatus}</span>
                ) : (
                  <button type="button" className="btn btn-primary-evege" onClick={register}>Register for this task</button>
                )}
              </div>
            )}
            {!isAdmin && !currentUser && (
              <p className="text-muted small mb-0">Sign in as an approved volunteer to register.</p>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="col-lg-5">
            <div className="form-card">
              <h6 className="fw-bold mb-2">Volunteer roster ({roster.length}/{task.capacity})</h6>
              {roster.length === 0 && <p className="text-muted small mb-0">No volunteers registered yet.</p>}
              {roster.map((r) => (
                <div key={r.id} className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 border-bottom">
                  <div>
                    <div className="fw-bold small">{r.volunteerEmail}</div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {r.attendanceStatus} · {r.verificationStatus} · {r.verifiedHours != null ? `${r.verifiedHours} h` : '— hours'}
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <button type="button" className="btn btn-ghost-evege btn-sm-evege"
                            disabled={r.attendanceStatus === 'PRESENT'}
                            onClick={() => markAttendance(r.volunteerEmail, 'PRESENT')}>Present</button>
                    <button type="button" className="btn btn-danger-evege btn-sm-evege"
                            disabled={r.attendanceStatus === 'ABSENT'}
                            onClick={() => markAttendance(r.volunteerEmail, 'ABSENT')}>Absent</button>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      placeholder="h"
                      className="form-control form-control-sm"
                      style={{ width: 70 }}
                      defaultValue={r.verifiedHours ?? ''}
                      onBlur={(e) => e.target.value && verifyHours(r.volunteerEmail, e.target.value)}
                      aria-label={`Verified hours for ${r.volunteerEmail}`}
                    />
                  </div>
                </div>
              ))}
              <p className="text-muted small mt-2 mb-0">
                Hours are awarded only to PRESENT volunteers and capped at the task's expected duration ({task.expectedHours} h).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
