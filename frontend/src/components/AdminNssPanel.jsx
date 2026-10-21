import React, { useEffect, useState } from 'react';
import {
  nssApplications, nssReviewApplication, nssTasks, nssCreateTask, nssUpdateTask,
  nssTaskRegistrations, nssMarkAttendance, nssVerifyHours, nssDeleteTask,
  fetchEvents, saveScore, scoresForEvent
} from '../services/apiService';

const SERVICE_CATEGORIES = ['ENVIRONMENT', 'CLEANLINESS', 'COMMUNITY_OUTREACH', 'AWARENESS', 'OTHER'];

export default function AdminNssPanel({ onBackToHome }) {
  const [tab, setTab] = useState('applications'); // applications | tasks | scoring
  const [apps, setApps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState({});
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // scoring state
  const [scoringEventId, setScoringEventId] = useState('');
  const [regs, setRegs] = useState([]);
  const [scoreDraft, setScoreDraft] = useState({});

  const loadBase = async () => {
    setLoading(true);
    try {
      const [a, t, e] = await Promise.all([
        nssApplications().catch(() => ({ data: [] })),
        nssTasks(true).catch(() => ({ data: [] })),
        fetchEvents().catch(() => ({ data: [] }))
      ]);
      setApps(a.data || []);
      setTasks(t.data || []);
      setEvents(e.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBase(); }, []);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 6000);
  };

  const review = async (id, decision) => {
    try {
      await nssReviewApplication(id, decision, notes[id] || '');
      flash('success', `Application ${decision === 'APPROVE' ? 'approved' : 'rejected'}.`);
      await loadBase();
    } catch (err) {
      flash('danger', err?.response?.data?.message || 'Review failed.');
    }
  };

  // ---- tasks ----
  const emptyTask = {
    title: '', description: '', serviceCategory: 'ENVIRONMENT', taskDate: '',
    startTime: '', endTime: '', location: '', expectedHours: 4, travelAssistance: true,
    accommodationProvided: false, capacity: 30, registrationDeadline: '',
    eligibility: 'Approved NSS volunteers', instructions: '', status: 'PUBLISHED'
  };
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const createTask = async () => {
    try {
      await nssCreateTask(taskForm);
      flash('success', 'Task created.');
      setTaskForm(emptyTask);
      setShowTaskForm(false);
      await loadBase();
    } catch (err) {
      flash('danger', err?.response?.data?.message || 'Could not create task.');
    }
  };

  const setTaskStatus = async (id, status, title) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel task “${title}”? Registered volunteers keep their records but hours are not counted.`)) return;
    try {
      await nssUpdateTask(id, { status });
      flash('success', `Task marked ${status.toLowerCase()}.`);
      await loadBase();
    } catch (err) {
      flash('danger', err?.response?.data?.message || 'Failed.');
    }
  };

  const deleteTask = async (id, title) => {
    if (!window.confirm(`Delete task “${title}”? Only possible when no one has registered.`)) return;
    try {
      await nssDeleteTask(id);
      flash('success', 'Task deleted.');
      await loadBase();
    } catch (err) {
      flash('danger', err?.response?.data?.message || 'Failed.');
    }
  };

  // ---- scoring ----
  const loadEventRegs = async (eventId) => {
    setScoringEventId(eventId);
    if (!eventId) { setRegs([]); return; }
    try {
      const all = await fetch('/api/registrations').then((r) => r.json());
      const current = await scoresForEvent(eventId).catch(() => ({ data: [] }));
      const scoredMap = new Map((current.data || []).map((s) => [s.participantEmail, s]));
      setRegs(
        (Array.isArray(all) ? all : [])
          .filter((r) => String(r.eventId) === String(eventId))
          .map((r) => ({ ...r, score: scoredMap.get(String(r.studentEmail || '').toLowerCase()) }))
      );
    } catch {
      setRegs([]);
    }
  };

  const submitScore = async (email, name, role) => {
    const marks = scoreDraft[email];
    if (marks === undefined || marks === '') { flash('warning', `Enter marks for ${name}.`); return; }
    try {
      await saveScore({
        eventId: Number(scoringEventId),
        email,
        marks: Number(marks),
        remarks: notes[`score-${email}`] || ''
      });
      flash('success', `Saved ${marks} marks for ${name || email}.`);
      await loadEventRegs(scoringEventId);
    } catch (err) {
      flash('danger', err?.response?.data?.message || 'Failed to save marks.');
    }
  };

  if (loading) {
    return <div className="feature-shell"><div className="form-card py-5 text-center">Loading admin data…</div></div>;
  }

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBackToHome}>
        <i className="bi bi-arrow-left me-1"></i> Back to Admin Home
      </button>

      <div className="feature-hero mb-3">
        <h2>NSS & Leaderboard Administration</h2>
        <p>Review volunteer applications, run service tasks, verify service hours and publish participant scores.</p>
      </div>

      <ul className="nav nav-pills mb-4">
        <li className="nav-item"><button type="button" className={`nav-link ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>NSS Applications ({apps.filter((a) => a.status === 'PENDING').length})</button></li>
        <li className="nav-item"><button type="button" className={`nav-link ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Task Management ({tasks.length})</button></li>
        <li className="nav-item"><button type="button" className={`nav-link ${tab === 'scoring' ? 'active' : ''}`} onClick={() => setTab('scoring')}>Participant Scoring</button></li>
      </ul>

      {msg && <div className={`alert alert-${msg.type} py-2 small`}>{msg.text}</div>}

      {tab === 'applications' && (
        <>
          {apps.length === 0 && <div className="form-card text-muted text-center py-4">No NSS applications yet.</div>}
          {apps.map((a) => (
            <div key={a.id} className="task-card">
              <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start">
                <div>
                  <h5 className="mb-1">{a.fullName} <span className={`nss-status ${a.status.toLowerCase()}`}>{a.status}</span></h5>
                  <div className="task-meta mb-1">
                    <span><i className="bi bi-envelope"></i>{a.studentEmail}</span>
                    <span><i className="bi bi-person-badge"></i>{a.studentId || '—'}</span>
                    <span><i className="bi bi-diagram-3"></i>{a.branch || '—'} {a.division ? `• Div ${a.division}` : ''}</span>
                    <span><i className="bi bi-telephone"></i>{a.phone || '—'}</span>
                  </div>
                  <p className="small text-muted mb-1"><strong>Why:</strong> {a.motivation}</p>
                  {a.experience && <p className="small text-muted mb-1"><strong>Experience:</strong> {a.experience}</p>}
                  {a.availability && <p className="small text-muted mb-0"><strong>Available:</strong> {a.availability}</p>}
                </div>
                {a.status === 'PENDING' && (
                  <div style={{ minWidth: 260 }}>
                    <textarea
                      className="form-control form-control-sm mb-2"
                      rows={2}
                      placeholder="Optional review note…"
                      value={notes[a.id] || ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                    />
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-primary-evege btn-sm-evege" onClick={() => review(a.id, 'APPROVE')}>Approve</button>
                      <button type="button" className="btn btn-danger-evege btn-sm-evege" onClick={() => review(a.id, 'REJECT')}>Reject</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'tasks' && (
        <>
          <button type="button" className="btn btn-primary-evege mb-3" onClick={() => setShowTaskForm((s) => !s)}>
            <i className="bi bi-plus-lg me-1"></i> {showTaskForm ? 'Close form' : 'New NSS Task'}
          </button>

          {showTaskForm && (
            <div className="form-card mb-4">
              <h6 className="fw-bold mb-3">Create task</h6>
              <div className="row g-3">
                <div className="col-md-6"><label>Title *</label><input className="form-control" value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} /></div>
                <div className="col-md-6">
                  <label>Service category</label>
                  <select className="form-select" value={taskForm.serviceCategory} onChange={(e) => setTaskForm((f) => ({ ...f, serviceCategory: e.target.value }))}>
                    {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-12"><label>Description</label><textarea className="form-control" rows={2} value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} /></div>
                <div className="col-md-4"><label>Date *</label><input type="date" className="form-control" value={taskForm.taskDate} onChange={(e) => setTaskForm((f) => ({ ...f, taskDate: e.target.value }))} /></div>
                <div className="col-md-4"><label>Start time *</label><input type="time" className="form-control" value={taskForm.startTime} onChange={(e) => setTaskForm((f) => ({ ...f, startTime: e.target.value }))} /></div>
                <div className="col-md-4"><label>End time *</label><input type="time" className="form-control" value={taskForm.endTime} onChange={(e) => setTaskForm((f) => ({ ...f, endTime: e.target.value }))} /></div>
                <div className="col-md-4"><label>Location</label><input className="form-control" value={taskForm.location} onChange={(e) => setTaskForm((f) => ({ ...f, location: e.target.value }))} /></div>
                <div className="col-md-4"><label>Expected hours *</label><input type="number" min="0.5" step="0.5" className="form-control" value={taskForm.expectedHours} onChange={(e) => setTaskForm((f) => ({ ...f, expectedHours: e.target.value }))} /></div>
                <div className="col-md-4"><label>Capacity</label><input type="number" min="1" className="form-control" value={taskForm.capacity} onChange={(e) => setTaskForm((f) => ({ ...f, capacity: e.target.value }))} /></div>
                <div className="col-md-4"><label>Registration deadline</label><input type="date" className="form-control" value={taskForm.registrationDeadline} onChange={(e) => setTaskForm((f) => ({ ...f, registrationDeadline: e.target.value }))} /></div>
                <div className="col-md-8"><label>Eligibility</label><input className="form-control" value={taskForm.eligibility} onChange={(e) => setTaskForm((f) => ({ ...f, eligibility: e.target.value }))} /></div>
                <div className="col-12"><label>Instructions</label><textarea className="form-control" rows={2} value={taskForm.instructions} onChange={(e) => setTaskForm((f) => ({ ...f, instructions: e.target.value }))} /></div>
                <div className="col-md-4 d-flex align-items-end"><div className="form-check"><input id="t-travel" type="checkbox" className="form-check-input" checked={taskForm.travelAssistance} onChange={(e) => setTaskForm((f) => ({ ...f, travelAssistance: e.target.checked }))} /><label className="form-check-label" htmlFor="t-travel">Travel assistance</label></div></div>
                <div className="col-md-4 d-flex align-items-end"><div className="form-check"><input id="t-stay" type="checkbox" className="form-check-input" checked={taskForm.accommodationProvided} onChange={(e) => setTaskForm((f) => ({ ...f, accommodationProvided: e.target.checked }))} /><label className="form-check-label" htmlFor="t-stay">Accommodation</label></div></div>
              </div>
              <button type="button" className="btn btn-primary-evege mt-3" onClick={createTask} disabled={!taskForm.title || !taskForm.taskDate}>
                Create task
              </button>
            </div>
          )}

          {tasks.map((t) => (
            <div key={t.id} className="task-card">
              <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start">
                <div>
                  <h5 className="mb-1">{t.title} <span className="chip">{t.status}</span>{t.isDemo && <span className="chip">demo</span>}</h5>
                  <div className="task-meta">
                    <span><i className="bi bi-calendar3"></i>{t.taskDate}</span>
                    <span><i className="bi bi-clock"></i>{t.startTime}–{t.endTime}</span>
                    <span><i className="bi bi-geo-alt"></i>{t.location}</span>
                    <span><i className="bi bi-people"></i>cap {t.capacity}</span>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {t.status === 'DRAFT' && <button type="button" className="btn btn-ghost-evege btn-sm-evege" onClick={() => setTaskStatus(t.id, 'PUBLISHED')}>Publish</button>}
                  {t.status === 'PUBLISHED' && <button type="button" className="btn btn-ghost-evege btn-sm-evege" onClick={() => setTaskStatus(t.id, 'COMPLETED')}>Mark completed</button>}
                  {t.status !== 'CANCELLED' && <button type="button" className="btn btn-danger-evege btn-sm-evege" onClick={() => setTaskStatus(t.id, 'CANCELLED', t.title)}>Cancel</button>}
                  <button type="button" className="btn btn-ghost-evege btn-sm-evege" onClick={() => deleteTask(t.id, t.title)}>Delete</button>
                </div>
              </div>
              {t.status !== 'DRAFT' && (
                <TaskRosterPanel taskId={t.id} onFlash={flash} />
              )}
            </div>
          ))}
        </>
      )}

      {tab === 'scoring' && (
        <>
          <div className="form-card mb-3">
            <label htmlFor="score-event">Select an event *</label>
            <select id="score-event" className="form-select" value={scoringEventId} onChange={(e) => loadEventRegs(e.target.value)}>
              <option value="">Choose event…</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title} ({ev.category})</option>)}
            </select>
          </div>

          {!scoringEventId && <div className="form-card text-muted text-center py-4">Choose an event to view its registered participants.</div>}

          {scoringEventId && regs.length === 0 && <div className="form-card text-muted text-center py-4">No registrations for this event yet.</div>}

          {regs.map((r) => (
            <div key={r.id || r.studentEmail} className="task-card">
              <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center">
                <div>
                  <div className="fw-bold">{r.studentName} <span className="text-muted small">({r.studentEmail})</span></div>
                  <div className="text-muted small">ID {r.collegeId} · {r.category} · {r.paymentStatus}</div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  {r.score && <span className="text-success small">Current: {r.score.marks} marks</span>}
                  <input
                    type="number" min="0" max="1000" className="form-control" style={{ width: 110 }}
                    placeholder="marks"
                    defaultValue={r.score?.marks ?? ''}
                    onChange={(e) => setScoreDraft((d) => ({ ...d, [r.studentEmail]: e.target.value }))}
                    aria-label={`Marks for ${r.studentName}`}
                  />
                  <input
                    className="form-control" style={{ width: 160 }}
                    placeholder={`Remarks${r.score?.remarks ? ` (now: ${r.score.remarks})` : ''}`}
                    onChange={(e) => setNotes((n) => ({ ...n, [`score-${r.studentEmail}`]: e.target.value }))}
                    aria-label={`Remarks for ${r.studentName}`}
                  />
                  <button type="button" className="btn btn-primary-evege btn-sm-evege" onClick={() => submitScore(r.studentEmail, r.studentName)}>
                    {r.score ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {scoringEventId && regs.length > 0 && (
            <p className="text-muted small">
              Division and branch come from the student's verified profile — the form cannot influence them.
              Updating marks keeps an audit row of every correction.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TaskRosterPanel({ taskId, onFlash }) {
  const [roster, setRoster] = useState([]);

  const load = async () => {
    try {
      const r = await nssTaskRegistrations(taskId);
      setRoster(r.data || []);
    } catch {
      setRoster([]);
    }
  };

  useEffect(() => { load(); }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (roster.length === 0) return <p className="text-muted small mt-2 mb-0">No volunteers registered yet.</p>;

  return (
    <div className="mt-3 pt-3 border-top">
      {roster.map((r) => (
        <div key={r.id} className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 border-bottom">
          <div>
            <div className="fw-bold small">{r.volunteerEmail}</div>
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
              {r.attendanceStatus} · {r.verificationStatus}{r.verifiedHours != null ? ` · ${r.verifiedHours} h` : ''}
            </div>
          </div>
          <div className="d-flex gap-1 align-items-center">
            <button type="button" className="btn btn-ghost-evege btn-sm-evege" disabled={r.attendanceStatus === 'PRESENT'}
                    onClick={async () => { try { await nssMarkAttendance(taskId, r.volunteerEmail, 'PRESENT'); await load(); } catch (e) { onFlash('danger', e?.response?.data?.message || 'Failed'); } }}>Present</button>
            <button type="button" className="btn btn-danger-evege btn-sm-evege" disabled={r.attendanceStatus === 'ABSENT'}
                    onClick={async () => { try { await nssMarkAttendance(taskId, r.volunteerEmail, 'ABSENT'); await load(); } catch (e) { onFlash('danger', e?.response?.data?.message || 'Failed'); } }}>Absent</button>
            <input
              type="number" min="0" max="24" step="0.5" placeholder="verify h"
              className="form-control form-control-sm" style={{ width: 90 }}
              defaultValue={r.verifiedHours ?? ''}
              onBlur={async (e) => {
                if (!e.target.value) return;
                try { await nssVerifyHours(taskId, r.volunteerEmail, Number(e.target.value)); await load(); }
                catch (err) { onFlash('danger', err?.response?.data?.message || 'Failed'); }
              }}
              aria-label={`Verified hours for ${r.volunteerEmail}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
