import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchEvents,
  createEvent,
  deleteEvent,
  fetchRegistrations,
  fetchAllUsers,
  fetchAllStudentAccounts,
  debugEmailCheck,
  deleteUserByEmail,
  resetAllStudentData,
  fetchStats
} from '../services/apiService';

export default function AdminPanel({ onBackToHome }) {
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'users', 'registrations'
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Email Inspector state
  const [inspectEmail, setInspectEmail] = useState('');
  const [inspectResult, setInspectResult] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state for adding a new event
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Technical',
    eventDate: '',
    eventTime: '',
    venue: '',
    description: '',
    tagline: 'Build \u2022 Learn \u2022 Grow',
    registrationFee: 100,
    upiId: 'evege@okaxis'
  });
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, accountsRes, regsRes, statsRes] = await Promise.all([
        fetchEvents(),
        fetchAllStudentAccounts().catch(() => fetchAllUsers()).catch(() => ({ data: [] })),
        fetchRegistrations().catch(() => ({ data: [] })),
        fetchStats().catch(() => ({ data: null }))
      ]);
      setEvents(eventsRes.data || []);
      setUsers(accountsRes.data || []);
      setRegistrations(regsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      setMsg({ type: 'danger', text: 'Error fetching data from PostgreSQL database.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    setSubmittingEvent(true);
    try {
      await createEvent({
        ...newEvent,
        registrationFee: Number(newEvent.registrationFee) || 100
      });
      setShowAddModal(false);
      setNewEvent({
        title: '',
        category: 'Technical',
        eventDate: '',
        eventTime: '',
        venue: '',
        description: '',
        tagline: 'Build \u2022 Learn \u2022 Grow',
        registrationFee: 100,
        upiId: 'evege@okaxis'
      });
      setMsg({ type: 'success', text: `Event "${newEvent.title}" successfully added to PostgreSQL database!` });
      loadData();
    } catch (err) {
      setMsg({ type: 'danger', text: err?.response?.data?.message || 'Failed to create event.' });
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleInspectEmail = async (e) => {
    if (e) e.preventDefault();
    if (!inspectEmail.trim()) return;
    setInspecting(true);
    setInspectResult(null);
    try {
      const res = await debugEmailCheck(inspectEmail.trim());
      setInspectResult(res.data);
    } catch (err) {
      setMsg({ type: 'danger', text: 'Error querying email in database.' });
    } finally {
      setInspecting(false);
    }
  };

  const handleDeleteAccount = async (email) => {
    if (!window.confirm(`Are you sure you want to completely delete account "${email}" from all PostgreSQL tables?`)) return;
    setActionLoading(true);
    try {
      const res = await deleteUserByEmail(email);
      setMsg({ type: 'success', text: res.data?.message || `Account ${email} deleted.` });
      if (inspectResult?.queryEmail === email) {
        setInspectResult(null);
      }
      loadData();
    } catch (err) {
      setMsg({ type: 'danger', text: err?.response?.data?.message || 'Failed to delete account.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetStudents = async () => {
    if (!window.confirm('Are you sure you want to wipe all student test data from PostgreSQL? (Admin account demoadmin@gmail.com will be kept safe)')) return;
    setActionLoading(true);
    try {
      const res = await resetAllStudentData();
      setMsg({ type: 'success', text: res.data?.message || 'All student test data cleared!' });
      setInspectResult(null);
      loadData();
    } catch (err) {
      setMsg({ type: 'danger', text: 'Failed to reset student data.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-panel-container py-3">
      {/* Top Banner & Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark fw-bold px-2 py-1">
              <i className="bi bi-shield-check me-1"></i> Admin Portal
            </span>
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
              <i className="bi bi-database-check me-1"></i> PostgreSQL Connected (:5433)
            </span>
          </div>
          <h2 className="fw-bold mt-1 mb-0">Event Management &amp; Database Central</h2>
          <p className="text-muted small mb-0">
            Control campus events, add or remove events, and inspect database manager tables.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm fw-bold shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus-circle me-1"></i> Add New Event
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} alert-dismissible fade show small mb-3`} role="alert">
          {msg.text}
          <button type="button" className="btn-close" onClick={() => setMsg(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="admin-metric-card card border-0 shadow-sm p-3 rounded-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Total Events</span>
                <h3 className="fw-bold mb-0 text-primary">{events.length}</h3>
              </div>
              <div className="metric-icon-box bg-primary-subtle text-primary">
                <i className="bi bi-calendar-event"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="admin-metric-card card border-0 shadow-sm p-3 rounded-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Registrations</span>
                <h3 className="fw-bold mb-0 text-success">{registrations.length}</h3>
              </div>
              <div className="metric-icon-box bg-success-subtle text-success">
                <i className="bi bi-ticket-perforated"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="admin-metric-card card border-0 shadow-sm p-3 rounded-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Collections</span>
                <h3 className="fw-bold mb-0 text-warning">₹{stats?.totalCollectedFees || registrations.length * 100}</h3>
              </div>
              <div className="metric-icon-box bg-warning-subtle text-warning">
                <i className="bi bi-currency-rupee"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="admin-metric-card card border-0 shadow-sm p-3 rounded-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Registered Students</span>
                <h3 className="fw-bold mb-0 text-info">{users.length}</h3>
              </div>
              <div className="metric-icon-box bg-info-subtle text-info">
                <i className="bi bi-people"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <ul className="nav nav-pills admin-nav-pills mb-3 border-bottom pb-2">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <i className="bi bi-calendar-check me-1"></i> Manage Events ({events.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people-fill me-1"></i> PostgreSQL Students Table ({users.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrations')}
          >
            <i className="bi bi-journal-text me-1"></i> PostgreSQL Registrations Table ({registrations.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: MANAGE EVENTS (ADD / REMOVE) */}
      {activeTab === 'events' && (
        <div className="admin-card card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Current Active Campus Events</h5>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Add Event
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle admin-table mb-0">
              <thead className="table-light small">
                <tr>
                  <th>ID</th>
                  <th>Event Title</th>
                  <th>Category</th>
                  <th>Date &amp; Time</th>
                  <th>Venue</th>
                  <th>Fee</th>
                  <th>Tagline</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      No events currently registered in database.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id}>
                      <td className="text-muted">#{ev.id}</td>
                      <td>
                        <strong>{ev.title}</strong>
                        {ev.description && (
                          <div className="text-muted extra-small text-truncate" style={{ maxWidth: '280px' }}>
                            {ev.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge-cat-tag ${ev.category?.toLowerCase()}`}>
                          {ev.category}
                        </span>
                      </td>
                      <td>
                        <div>{ev.eventDate || 'TBD'}</div>
                        <div className="text-muted extra-small">{ev.eventTime || '9:00 AM - 5:00 PM'}</div>
                      </td>
                      <td>{ev.venue || 'College Auditorium'}</td>
                      <td className="text-success fw-bold">₹{ev.registrationFee || 100}</td>
                      <td className="text-muted fst-italic">{ev.tagline || '-'}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm px-2 py-1 shadow-sm"
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          title="Remove event from database"
                        >
                          <i className="bi bi-trash3 me-1"></i> Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: POSTGRESQL REGISTERED ACCOUNTS TABLE */}
      {activeTab === 'users' && (
        <div className="admin-card card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h5 className="fw-bold mb-0">Registered Accounts (PostgreSQL Table: <code>student_accounts</code> &amp; <code>users</code>)</h5>
              <span className="text-muted small">Live student accounts created on the website (stored in PostgreSQL).</span>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={loadData}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm px-3"
                onClick={handleResetStudents}
                disabled={actionLoading}
              >
                <i className="bi bi-trash3 me-1"></i> Wipe All Student Test Data
              </button>
              <span className="badge bg-primary px-3 py-2">{users.length} Records</span>
            </div>
          </div>

          {/* Email Inspector / Diagnostic Card */}
          <div className="card bg-light border-0 p-3 mb-4 rounded-3">
            <h6 className="fw-bold mb-2 text-dark">
              <i className="bi bi-search me-1 text-primary"></i> Email Inspector &amp; Account Debugger
            </h6>
            <p className="text-muted small mb-2">
              If an email is showing "already exists" on the website or you want to check where it is stored in PostgreSQL, enter it below:
            </p>
            <form onSubmit={handleInspectEmail} className="d-flex gap-2">
              <input
                type="email"
                className="form-control form-control-sm"
                placeholder="Enter email to check (e.g. yourname@gmail.com)"
                value={inspectEmail}
                onChange={(e) => setInspectEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm px-3 text-nowrap"
                disabled={inspecting}
              >
                {inspecting ? 'Checking…' : <><i className="bi bi-search me-1"></i> Check in Database</>}
              </button>
            </form>

            {inspectResult && (
              <div className="mt-3 p-3 bg-white border rounded-3 shadow-sm small">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-dark">Inspection Result for <code>{inspectResult.queryEmail}</code>:</strong>
                  {inspectResult.existsOverall && inspectResult.queryEmail !== 'demoadmin@gmail.com' && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm py-1 px-3 fw-bold"
                      onClick={() => handleDeleteAccount(inspectResult.queryEmail)}
                      disabled={actionLoading}
                    >
                      <i className="bi bi-trash3 me-1"></i> Delete This Email From All Tables
                    </button>
                  )}
                </div>

                <div className="row g-2">
                  <div className="col-12 col-md-4">
                    <div className={`p-2 rounded border ${inspectResult.foundIn_student_accounts ? 'border-success bg-success-subtle' : 'border-secondary bg-light'}`}>
                      <strong>Table <code>student_accounts</code>:</strong>
                      <div>{inspectResult.foundIn_student_accounts ? `✅ Found (ID #${inspectResult.foundIn_student_accounts.id}, Pass: ${inspectResult.foundIn_student_accounts.password})` : '❌ Not Found'}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className={`p-2 rounded border ${inspectResult.foundIn_users ? 'border-success bg-success-subtle' : 'border-secondary bg-light'}`}>
                      <strong>Table <code>users</code>:</strong>
                      <div>{inspectResult.foundIn_users ? `✅ Found (Role: ${inspectResult.foundIn_users.role})` : '❌ Not Found'}</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className={`p-2 rounded border ${inspectResult.foundIn_students ? 'border-success bg-success-subtle' : 'border-secondary bg-light'}`}>
                      <strong>Table <code>students</code>:</strong>
                      <div>{inspectResult.foundIn_students ? `✅ Found (Name: ${inspectResult.foundIn_students.name})` : '❌ Not Found'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle admin-table mb-0">
              <thead className="table-light small">
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Password</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Branch</th>
                  <th>Roll No</th>
                  <th>College</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody className="small">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="text-muted">#{u.id}</td>
                      <td className="fw-bold">{u.fullName}</td>
                      <td>
                        <code>{u.email}</code>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace">
                          {u.password || '••••••••'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                          {u.role || 'STUDENT'}
                        </span>
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td>{u.branch || '-'}</td>
                      <td>{u.rollNumber || '-'}</td>
                      <td className="text-muted extra-small">{u.college || '-'}</td>
                      <td className="text-end">
                        {u.email !== 'demoadmin@gmail.com' ? (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm py-1 px-2"
                            onClick={() => handleDeleteAccount(u.email)}
                            disabled={actionLoading}
                            title="Delete this account from database"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        ) : (
                          <span className="badge bg-secondary">System Admin</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: POSTGRESQL REGISTRATIONS TABLE */}
      {activeTab === 'registrations' && (
        <div className="admin-card card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0">All Registrations (PostgreSQL Table: <code>registrations</code>)</h5>
              <span className="text-muted small">Real-time payment and registration entries.</span>
            </div>
            <span className="badge bg-success">{registrations.length} Entries</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle admin-table mb-0">
              <thead className="table-light small">
                <tr>
                  <th>ID</th>
                  <th>Student Name</th>
                  <th>Student Email</th>
                  <th>College ID</th>
                  <th>Event Name</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>UTR Ref</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="small">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      No registration records captured yet.
                    </td>
                  </tr>
                ) : (
                  registrations.map((r) => (
                    <tr key={r.id}>
                      <td className="text-muted">#{r.id}</td>
                      <td className="fw-bold">{r.studentName}</td>
                      <td><code>{r.studentEmail}</code></td>
                      <td>{r.collegeId}</td>
                      <td><strong>{r.eventTitle}</strong></td>
                      <td><span className="badge bg-secondary-subtle text-dark">{r.category || 'Event'}</span></td>
                      <td className="text-success fw-bold">₹{r.amount || 100}</td>
                      <td><code className="text-dark">{r.transactionRef}</code></td>
                      <td>
                        <span className="status-badge-paid py-1 px-2">{r.paymentStatus}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW EVENT */}
      {showAddModal && (
        <div className="evege-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-card card p-4 shadow-lg border-0 rounded-4" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-calendar-plus text-primary me-2"></i> Add New Campus Event
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
            </div>

            <form onSubmit={handleCreateEvent}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold">Event Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. AI & Robotics Hackathon 2026"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Category *</label>
                  <select
                    className="form-select"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    required
                  >
                    <option value="Technical">Technical</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Registration Fee (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newEvent.registrationFee}
                    onChange={(e) => setNewEvent({ ...newEvent, registrationFee: e.target.value })}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Event Date *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 24 November 2026"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold">Event Time *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 10:00 AM - 5:00 PM"
                    value={newEvent.eventTime}
                    onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">Venue *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. College Auditorium / Main Stadium"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">Tagline (Handwritten text)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Build • Learn • Grow"
                    value={newEvent.tagline}
                    onChange={(e) => setNewEvent({ ...newEvent, tagline: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Short description of the event..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary fw-bold px-4"
                  disabled={submittingEvent}
                >
                  {submittingEvent ? 'Saving to Database...' : 'Save & Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
