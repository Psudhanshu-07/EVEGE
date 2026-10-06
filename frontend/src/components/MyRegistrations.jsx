import React, { useState, useEffect } from 'react';
import { fetchRegistrations } from '../services/apiService';

export default function MyRegistrations({ currentUser, onBrowseEvents }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegs();
  }, [currentUser]);

  const loadRegs = async () => {
    setLoading(true);
    try {
      const email = currentUser?.email;
      const res = await fetchRegistrations(email);
      setRegistrations(res.data || []);
    } catch (err) {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-registrations-container py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">My Event Passes &amp; Registrations</h3>
          <p className="text-muted small mb-0">
            All your confirmed campus event entries stored in the PostgreSQL database.
          </p>
        </div>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={loadRegs}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted small">Loading your event passes...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="empty-registrations-card text-center p-5 bg-white rounded-4 shadow-sm">
          <i className="bi bi-ticket-perforated fs-1 text-muted mb-3 d-block"></i>
          <h5 className="fw-bold">No Registrations Yet</h5>
          <p className="text-muted small mb-3">
            You haven't registered for any events yet. Check out the latest Technical, Sports, and Cultural events!
          </p>
          <button type="button" className="btn btn-primary" onClick={onBrowseEvents}>
            <i className="bi bi-compass me-1"></i> Explore Campus Events
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {registrations.map((r) => (
            <div className="col-12 col-md-6" key={r.id}>
              <div className="pass-card card border-0 shadow-sm rounded-4 p-3 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      {r.category || 'Campus Event'}
                    </span>
                    <span className="status-badge-paid">
                      <i className="bi bi-check-circle-fill me-1"></i> {r.paymentStatus || 'CONFIRMED'}
                    </span>
                  </div>

                  <h5 className="fw-bold mb-1">{r.eventTitle}</h5>

                  <div className="pass-details-table small text-muted my-2">
                    <div>
                      <strong>Participant:</strong> {r.studentName}
                    </div>
                    <div>
                      <strong>Email:</strong> {r.studentEmail}
                    </div>
                    <div>
                      <strong>College ID:</strong> {r.collegeId}
                    </div>
                    <div>
                      <strong>Amount Paid:</strong> ₹{r.amount || 100}
                    </div>
                    <div>
                      <strong>Transaction Ref:</strong> <code>{r.transactionRef}</code>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                  <span className="text-muted extra-small">
                    Registered: {r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : 'Active'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => window.print()}
                  >
                    <i className="bi bi-printer me-1"></i> Print Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

