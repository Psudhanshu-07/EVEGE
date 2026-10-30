import React, { useEffect, useMemo, useState } from 'react';
import { scheduleDay, scheduleAssess } from '../services/apiService';

/**
 * Day-Plan Scheduling Assistant.
 * Shows all events for a chosen date and the recommended conflict-free
 * itinerary computed by the backend weighted-interval algorithm.
 */

// ---- shared date/time helpers (local-timezone safe: no UTC conversion) ----
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// today's date in the browser's own timezone — avoids the IST off-by-one of toISOString()
const localToday = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

// Parse the site's stored date strings: "yyyy-MM-dd" or "24 November 2026". Returns null for unknown/legacy.
const parseEventDate = (s) => {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // leading ISO dates (e.g. "2026-10-10" or a ranged string) — keep the calendar date
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    // validate it is a real date
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return s.slice(0, 10);
  }
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?$/);
  if (m) {
    const mi = MONTHS.findIndex((mo) => mo.toLowerCase().startsWith(m[2].toLowerCase().slice(0, 3)));
    if (mi >= 0) return m[3] ? `${m[3]}-${String(mi + 1).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}` : null;
  }
  return null;
};

const dateLabel = (s) => { // "24 Nov 2026" for a compact header
  if (!s) return 'Date not set';
  const iso = parseEventDate(s) || (s.match(/^\d{4}-\d{2}-\d{2}/) && s.slice(0, 10));
  if (!iso) return s; // legacy/unrecognised — show as stored
  const [y, m, d] = iso.split('-').map(Number);
  const wd = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y} · ${wd}`;
};

// Parse one "H:MM AM/PM" token into minutes-past-midnight. Returns null if unparseable.
const clockToMinutes = (token) => {
  const m = token.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3].toUpperCase();
  if (h === 12) h = 0;
  return (ap === 'PM' ? 720 : 0) + h * 60 + min;
};

// Parse "9:00 AM - 12:30 PM" (the convention stored for every event) into {start, end} minutes.
const timeRange = (eventTime) => {
  if (!eventTime) return null;
  const parts = eventTime.split('-');
  if (parts.length !== 2) return null;
  const start = clockToMinutes(parts[0]);
  const end = clockToMinutes(parts[1]);
  if (start == null || end == null || end <= start) return null;
  return { start, end };
};

// Pure time-interval overlap: [aStart,aEnd) vs [bStart,bEnd). Touching intervals never clash.
const overlaps = (a, b) => a.start < b.end && b.start < a.end;

export default function SchedulingAssistant({ events, registrations = [], onBack, onRegister }) {
  const [date, setDate] = useState(localToday());
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

  // --- All scheduled events, grouped by date, chronological within each date ---
  const groupedEvents = useMemo(() => {
    const withDates = events.map((ev) => ({
      ev,
      iso: parseEventDate(ev.eventDate),
      range: timeRange(ev.eventTime)
    }));
    // events with an unknown date (legacy) go into their own trailing bucket
    const dated = withDates.filter((x) => x.iso);
    const undated = withDates.filter((x) => !x.iso);
    dated.sort((a, b) => {
      if (a.iso !== b.iso) return a.iso.localeCompare(b.iso);
      const as = a.range ? a.range.start : Number.MAX_SAFE_INTEGER;
      const bs = b.range ? b.range.start : Number.MAX_SAFE_INTEGER;
      return as - bs;
    });
    const groups = [];
    for (const item of dated) {
      const last = groups[groups.length - 1];
      if (last && last.iso === item.iso) last.items.push(item);
      else groups.push({ iso: item.iso, items: [item] });
    }
    return { groups, undated };
  }, [events]);

  // Conflict badges: same-date events whose intervals overlap (pure time overlap).
  const conflictIdsFor = (iso) => {
    const group = groupedEvents.groups.find((g) => g.iso === iso);
    if (!group) return new Map();
    const map = new Map();
    for (const a of group.items) {
      if (!a.range) continue;
      for (const b of group.items) {
        if (b === a || !b.range) continue;
        if (a.ev.id !== b.ev.id && overlaps(a.range, b.range)) {
          if (!map.has(a.ev.id)) map.set(a.ev.id, []);
          map.get(a.ev.id).push(b);
        }
      }
    }
    return map;
  };

  const [myAssess, setMyAssess] = useState(null);
  const [myAssessLoading, setMyAssessLoading] = useState(false);
  const [myAssessIds, setMyAssessIds] = useState([]);

  // --- My registered events on the chosen date: real clash analysis from the DB ---
  useEffect(() => {
    let dead = false;
    // The parent only passes this student's own registrations (email-filtered).
    const mine = (registrations || []).filter((r) => r && r.eventId != null);
    const onDate = mine.filter((r) => {
      const ev = events.find((e) => String(e.id) === String(r.eventId));
      return ev && (parseEventDate(ev.eventDate) || '').slice(0, 10) === date;
    });
    const selectedIds = [...new Set(onDate.map((r) => r.eventId))];
    setMyAssessIds(selectedIds);
    if (!selectedIds.length) {
      setMyAssess(null);
      return;
    }
    setMyAssessLoading(true);
    scheduleAssess(date, selectedIds)
      .then((res) => { if (!dead) setMyAssess(res.data); })
      .catch(() => { if (!dead) setMyAssess(null); })
      .finally(() => { if (!dead) setMyAssessLoading(false); });
    return () => { dead = true; };
  }, [date, events, registrations]);

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to Events
      </button>

      <div className="feature-head">
        <div>
          <h2 className="fw-bold mb-1">Plan My Day</h2>
          <p className="text-muted mb-0" style={{ maxWidth: 640 }}>
            Every event grouped by its calendar date in chronological order, plus a conflict-free
            itinerary for the chosen day. Overlaps, venue travel time (15 min between blocks) and deadlines are accounted for automatically.
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

      {/* ===== All scheduled events — grouped by date, chronological ===== */}
      <section className="form-card mb-4">
        <h5 className="fw-bold mb-3"><i className="bi bi-calendar-week me-2 text-primary"></i>All scheduled events</h5>
        {(!events || events.length === 0) ? (
          <p className="text-muted mb-0">No events published yet.</p>
        ) : (
          <>
            {groupedEvents.groups.map((g) => {
              const cmap = conflictIdsFor(g.iso);
              return (
                <div key={g.iso} className="sched-dategroup">
                  <div className="sched-datehead">
                    <i className="bi bi-calendar3 me-2"></i>{dateLabel(g.iso)}
                    <span className="text-muted small ms-2">{g.items.length} event{g.items.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="schedule-table-wrap">
                    <table className="table table-sm schedule-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '15%' }}>Start</th>
                          <th style={{ width: '12%' }}>End</th>
                          <th>Event</th>
                          <th>Venue</th>
                          <th style={{ width: '18%' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map(({ ev, range }) => {
                          const conflicts = cmap.get(ev.id) || [];
                          const fmtClock = (mins) => {
                            const h24 = Math.floor(mins / 60);
                            const m = mins % 60;
                            const ap = h24 >= 12 ? 'PM' : 'AM';
                            const h = h24 % 12 === 0 ? 12 : h24 % 12;
                            return `${h}:${String(m).padStart(2, '0')} ${ap}`;
                          };
                          return (
                            <tr key={ev.id}>
                              <td className="fw-semibold">{range ? fmtClock(range.start) : (ev.eventTime || '—')}</td>
                              <td>{range ? fmtClock(range.end) : '—'}</td>
                              <td className="fw-semibold">{ev.title}</td>
                              <td className="text-muted">{ev.venue || '—'}</td>
                              <td>
                                {range ? (
                                  conflicts.length > 0 ? (
                                    <span className="badge rounded-pill text-bg-warning" title={conflicts.map((c) => c.title).join(', ')}>
                                      <i className="bi bi-exclamation-triangle me-1"></i>
                                      Clashes with {conflicts.map((c) => c.title).join(', ')}
                                    </span>
                                  ) : (
                                    <span className="badge rounded-pill text-bg-success">
                                      <i className="bi bi-check2 me-1"></i>Conflict-free
                                    </span>
                                  )
                                ) : (
                                  <span className="text-muted small">Time not set</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {groupedEvents.undated.length > 0 && (
              <div className="sched-dategroup">
                <div className="sched-datehead text-muted">
                  <i className="bi bi-calendar-x me-2"></i>Date not set
                  <span className="small ms-2">{groupedEvents.undated.length} legacy event{groupedEvents.undated.length > 1 ? 's' : ''}</span>
                </div>
                <div className="text-muted small">
                  {groupedEvents.undated.map(({ ev }) => ev.title).join(', ')} — stored without a parseable date.
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ===== My registered events on the chosen date ===== */}
      {myAssessIds.length > 0 && (
        <section className="form-card mb-4">
          <h5 className="fw-bold mb-3"><i className="bi bi-person-check me-2 text-success"></i>My selected events on {dateLabel(date)}</h5>
          {myAssessLoading && <p className="text-muted mb-0"><span className="spinner-border spinner-border-sm me-2"></span>Checking clashes…</p>}
          {!myAssessLoading && myAssess && Array.isArray(myAssess.excluded) && myAssess.excluded.length === 0 && myAssess.itinerary?.length > 0 && (
            <p className="text-success mb-0"><i className="bi bi-check-circle me-1"></i>All of your selected events for this day fit with no time clashes — {myAssess.itinerary.length} events, {((myAssess.totalMinutes || 0) / 60).toFixed(1)} h total.</p>
          )}
          {!myAssessLoading && myAssess && Array.isArray(myAssess.excluded) && myAssess.excluded.length > 0 && (
            <>
              {myAssess.itinerary?.map((item, i) => (
                <div key={`fit-${i}`} className="task-card d-flex justify-content-between align-items-center" style={{ padding: '12px 16px' }}>
                  <div>
                    <div className="fw-bold small"><i className="bi bi-check2-circle text-success me-1"></i>{item.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.83rem' }}>{fmt(item.start)} – {fmt(item.end)} · {item.venue}</div>
                  </div>
                  <span className="badge rounded-pill text-bg-success">Fits</span>
                </div>
              ))}
              {myAssess.excluded.map((item, i) => (
                <div key={`clash-${i}`} className="task-card d-flex justify-content-between align-items-center" style={{ padding: '12px 16px' }}>
                  <div>
                    <div className="fw-bold small"><i className="bi bi-x-octagon text-danger me-1"></i>{item.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.83rem' }}>{item.conflictWith || item.excludeReason || 'Conflicts with another selected event.'}</div>
                  </div>
                  <span className="badge rounded-pill text-bg-danger">Clash</span>
                </div>
              ))}
            </>
          )}
          {!myAssessLoading && !myAssess && <p className="text-muted mb-0">Could not check clashes right now — the scheduling service may be busy. The chronological list above always stays accurate.</p>}
        </section>
      )}

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
            <div className="feature-stat"><div className="num">{((plan.totalMinutes || 0) / 60).toFixed(1)} h</div><div className="lbl">Scheduled time</div></div>
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
