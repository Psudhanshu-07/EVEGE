import React, { useEffect, useState } from 'react';
import { scheduleDay } from '../services/apiService';

/**
 * Day-Plan Scheduling Assistant.
 * Shows all events for a chosen date and the recommended conflict-free
 * itinerary computed by the backend weighted-interval algorithm.
 */
export default function SchedulingAssistant({ events, onBack, onRegister }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ittId, setIttId] = useState(0); // animation key

  const load = async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await scheduleDay(d);
      setPlan(res.data);
      setIttId((n) => n + 1);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not compute the plan for this date.');
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(date); }, [date]);

  const fmt = (t) => {
    try {
      return new Date(`2000-01-01T${t.slice(0, 5)}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch { return t || ''; }
  };

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to Events
      </button>

      <div className="feature-head">
        <div>
          <h2 className="fw-bold mb-1">Daily Scheduling Assistant</h2>
          <p className="text-muted mb-0" style={{ maxWidth: 640 }}>
            Pick a date to see every event running that day and a conflict-free itinerary.
            Overlaps, venue travel time (15 min between blocks) and deadlines are accounted for automatically.
          </p>
        </div>
        <div className="form-card p-3">
          <label htmlFor="sched-date">Pick a date</label>
          <input
            id="sched-date"
            type="date"
            className="form-control"
            value={date}
            min="2026-01-01"
            max="2027-12-31"
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="form-card text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
          <p className="mt-3 mb-0 text-muted">Planning your day…</p>
        </div>
      )}

      {!loading && error && (
        <div className="form-card text-center py-5">
          <i className="bi bi-wifi-off fs-1 text-danger"></i>
          <p className="mt-3 mb-0 text-muted">{error}</p>
        </div>
      )}

      {!loading && plan && (
        <>
          <div className="feature-stats">
            <div className="feature-stat"><div className="num">{plan.totalEvents}</div><div className="lbl">Events recommended</div></div>
            <div className="feature-stat"><div className="num">{(plan.totalMinutes / 60).toFixed(1)} h</div><div className="lbl">Scheduled time</div></div>
            <div className="feature-stat"><div className="num">{plan.excluded.length}</div><div className="lbl">Events left out</div></div>
          </div>

          {plan.totalEvents === 0 ? (
            <div className="form-card text-center py-5">
              <i className="bi bi-calendar-x fs-1 text-muted"></i>
              <h5 className="mt-3 fw-bold">Free day!</h5>
              <p className="text-muted mb-0">{plan.note}</p>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-7">
                <div className="form-card">
                  <h5 className="fw-bold mb-3"><i className="bi bi-clock-history me-2 text-primary"></i>Recommended itinerary</h5>
                  <p className="text-muted small">{plan.note}</p>
                  <div className="timeline">
                    {plan.itinerary.map((item, i) => (
                      <div key={item.eventId || i} className="timeline-item">
                        <div className="timeline-time">{fmt(item.start)} – {fmt(item.end)}</div>
                        <div className="timeline-title">{item.title}</div>
                        <div className="timeline-sub">
                          <i className="bi bi-geo-alt me-1"></i>{item.venue}
                          {item.travelBufferAfterMin > 0 && (
                            <span className="ms-2 text-muted">
                              <i className="bi bi-arrow-right me-1"></i>{item.travelBufferAfterMin} min to next venue
                            </span>
                          )}
                        </div>
                        {item.fee != null && (
                          <button type="button" className="btn btn-sm btn-primary-evege mt-2" onClick={() => onRegister(item)}>
                            Register · ₹{Number(item.fee).toFixed(2)}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="form-card">
                  <h5 className="fw-bold mb-3"><i className="bi bi-slash-circle me-2 text-danger"></i>Why these were left out</h5>
                  {plan.excluded.length === 0 ? (
                    <p className="text-muted mb-0">Every scheduled event fits — nothing was excluded.</p>
                  ) : (
                    plan.excluded.map((item, i) => (
                      <div key={item.eventId || i} className="task-card" style={{ padding: '12px 16px' }}>
                        <div className="fw-bold small">{item.title}</div>
                        <div className="text-muted" style={{ fontSize: '0.83rem' }}>
                          {item.conflictWith || item.excludeReason || 'Not needed for the optimal plan.'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
