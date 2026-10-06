import React, { useMemo, useState } from 'react';

const FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Techfest', label: 'Techfest [Srujanam]' },
  { key: 'Cultural', label: 'Cultural [Naad]' },
  { key: 'Sports', label: 'Sports [Naad]' }
];

export default function EventList({ events, onPayAndRegister }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return activeFilter === 'All'
      ? list
      : list.filter((e) => e.category === activeFilter);
  }, [events, activeFilter]);

  return (
    <div className="evege-card">
      <div className="card-pad">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h6 className="section-title mb-0">
            <i className="bi bi-calendar-check text-primary"></i> All Events
          </h6>
          <span className="text-muted small">{filtered.length} event(s)</span>
        </div>

        {/* Filter tabs */}
        <ul className="nav nav-pills evege-pills mb-3" role="tablist">
          {FILTERS.map((f) => (
            <li className="nav-item" key={f.key}>
              <button
                type="button"
                className={`nav-link ${activeFilter === f.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="table-responsive">
          <table className="table evege-table align-middle mb-0">
            <thead className="table-light small">
              <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Registration Fee</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody className="small">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No events in this category yet.
                  </td>
                </tr>
              ) : (
                filtered.map((event) => (
                  <tr key={event.id}>
                    <td className="fw-bold">{event.title}</td>
                    <td>
                      <span className="badge-cat">{event.category}</span>
                    </td>
                    <td>{event.eventDate}</td>
                    <td>{event.venue}</td>
                    <td className="text-success fw-bold">₹100</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-pay btn-sm fw-bold"
                        onClick={() => onPayAndRegister(event)}
                      >
                        <i className="bi bi-qr-code-scan me-1"></i> Pay ₹100 &amp; Register
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
