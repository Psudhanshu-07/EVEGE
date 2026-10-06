import React, { useEffect, useState, useCallback } from 'react';
import StatCards from './components/StatCards';
import EventList from './components/EventList';
import RegistrationModal from './components/RegistrationModal';
import PaymentModal from './components/PaymentModal';
import { fetchEvents, fetchStats, fetchRegistrations, registerForEvent } from './services/apiService';

const FEE = 100;

export default function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  // Modal flow state: selectedEvent -> student details -> payment
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [student, setStudent] = useState({ studentName: '', studentEmail: '', collegeId: '' });

  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', text }
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes, regsRes] = await Promise.all([
        fetchEvents(),
        fetchStats(),
        fetchRegistrations().catch(() => ({ data: [] }))
      ]);
      setEvents(eventsRes.data);
      setStats(statsRes.data);
      setRegistrations(regsRes.data);
    } catch (err) {
      setBanner({
        type: 'error',
        text: 'Could not reach the backend. Start it with `docker compose up` or run the Spring Boot app.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(t);
  }, [banner]);

  // Step 1: "Pay ₹100 & Register" opens the registration modal
  const openRegistration = (event) => {
    setSelectedEvent(event);
    setShowRegistrationModal(true);
  };

  // Step 2: valid student details open the payment (QR) modal
  const handleStudentDetails = (details) => {
    setStudent(details);
    setShowRegistrationModal(false);
    setShowPaymentModal(true);
  };

  // Step 3: persist the registration + transaction reference
  const handlePaymentConfirmed = async (payload) => {
    const res = await registerForEvent(payload);
    setRegistrations((prev) => [res.data, ...prev]);
    setShowPaymentModal(false);

    setBanner({
      type: 'success',
      text: `Payment of ₹${FEE}.00 recorded! ${payload.studentName} is registered for "${selectedEvent.title}" (UTR ${payload.transactionRef}).`
    });

    setSelectedEvent(null);
    setStudent({ studentName: '', studentEmail: '', collegeId: '' });
    fetchStats().then((s) => setStats(s.data)).catch(() => {});
  };

  const closeModals = () => {
    setShowRegistrationModal(false);
    setShowPaymentModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="app-root">
      {/* ---------- Navbar ---------- */}
      <nav className="evege-navbar">
        <div className="container-xl d-flex align-items-center justify-content-between gap-3">
          <span className="evege-logo on-dark">
            <span className="logo-mark">
              <i className="bi bi-calendar2-event-fill"></i>
            </span>
            <span className="logo-text">
              <span className="logo-name">EVEGE</span>
              <span className="logo-tag">EVENTS &middot; PEOPLE &middot; MEMORIES</span>
            </span>
          </span>

          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            <span className="nav-link active">Home</span>
            <span className="nav-link">Events</span>
            <span className="nav-link">My Registrations ({registrations.length})</span>
            <span className="user-chip">
              <span className="avatar">ST</span>
              <span>Student</span>
              <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}></i>
            </span>
          </div>
        </div>
      </nav>

      <div className="container-xl page-shell">
        {/* ---------- Submission banner ---------- */}
        {banner && (
          <div className={`banner-toast ${banner.type}`}>
            <i className={banner.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill'}></i>
            <span>{banner.text}</span>
            <button type="button" className="btn-close-custom" onClick={() => setBanner(null)} aria-label="Dismiss">
              &times;
            </button>
          </div>
        )}

        {/* ---------- Greeting ---------- */}
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
          <div>
            <div className="handwritten text-primary" style={{ fontSize: '1.35rem' }}>
              Build &middot; Learn &middot; Grow
            </div>
            <h4 className="fw-bold mb-0">Welcome back, Student 👋</h4>
            <span className="text-muted small">Here's what's happening on campus.</span>
          </div>
          <span className="badge-cat">
            <i className="bi bi-calendar2-week me-1"></i> Academic Year 2026
          </span>
        </div>

        {/* ---------- Stats ---------- */}
        <StatCards stats={stats} />

        {/* ---------- Event table ---------- */}
        {loading ? (
          <div className="evege-card empty-state">
            <i className="bi bi-arrow-repeat"></i>
            <p className="mb-0 mt-2">Loading events…</p>
          </div>
        ) : (
          <EventList events={events} onPayAndRegister={openRegistration} />
        )}

        {/* ---------- Recent registrations ---------- */}
        {registrations.length > 0 && (
          <div className="evege-card mt-4">
            <div className="card-pad">
              <h6 className="section-title mb-3">
                <i className="bi bi-journal-check text-success"></i> Recent Registrations
              </h6>
              <div className="table-responsive">
                <table className="table evege-table align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Student</th>
                      <th>College ID</th>
                      <th>Event</th>
                      <th>Transaction Ref</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {registrations.slice(0, 6).map((r) => (
                      <tr key={r.id}>
                        <td className="fw-bold">{r.studentName}</td>
                        <td>{r.collegeId}</td>
                        <td>{r.eventTitle}</td>
                        <td className="text-muted">{r.transactionRef}</td>
                        <td>
                          <span className="status-badge confirmed">{r.paymentStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="brand-footnote handwritten" style={{ fontSize: '1.15rem' }}>
          More Events. More Connections.
        </div>
      </div>

      {/* ---------- Modal flow ---------- */}
      <RegistrationModal
        show={showRegistrationModal}
        event={selectedEvent}
        onClose={closeModals}
        onSubmit={handleStudentDetails}
      />

      <PaymentModal
        show={showPaymentModal}
        event={selectedEvent}
        student={student}
        onClose={closeModals}
        onConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
}
