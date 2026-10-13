import React, { useMemo } from 'react';

const descriptions = {
  Cricket: 'Cheer on your college teams at a lively match on the ground.',
  Football: 'Get together for an exciting match on the sports field.',
  'Code Challenge': 'Take on coding challenges and show off your problem-solving skills.',
  Robotics: 'Explore creative builds and hands-on engineering projects.',
  'Dance Competition': 'Celebrate student talent with music, dance and performances.',
  'Singing Competition': 'Enjoy live performances from talented student singers.'
};

function formatDate(value, longMonth = false) {
  if (!value) return 'Date to be announced';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: longMonth ? 'long' : 'short',
    year: 'numeric'
  }).format(date);
}

export default function HeroSection({ events = [], onExplore, onOpenRegister }) {
  const featuredEvent = useMemo(() => (
    [...events].sort((a, b) => String(a.eventDate || '').localeCompare(String(b.eventDate || '')))[0]
  ), [events]);
  const categories = useMemo(
    () => new Set(events.map((event) => event.category).filter(Boolean)).size,
    [events]
  );

  return (
    <section className="enhanced-hero" aria-labelledby="hero-title">
      <div className="enhanced-hero-content">
        <p className="hero-eyebrow">EVEGE &bull; COLLEGE EVENT PORTAL</p>
        <div className="portal-icon" aria-hidden="true"><i className="bi bi-mortarboard-fill"></i></div>
        <h1 id="hero-title">Campus stories in motion.</h1>
        <p className="enhanced-hero-copy">
          Experience the energy of campus through technical events, cultural celebrations,
          sports moments and the connections that shape student life.
        </p>
        <div className="hero-actions">
          <button type="button" className="enhanced-primary-action" onClick={onOpenRegister}>
            Join the campus community <span aria-hidden="true">&rarr;</span>
          </button>
          <button type="button" className="enhanced-secondary-action" onClick={onExplore}>
            Explore events
          </button>
        </div>
        <div className="hero-metrics" aria-label="Upcoming event summary">
          <div><strong>{events.length}</strong><span>Upcoming events</span></div>
          <div><strong>{categories}</strong><span>Categories</span></div>
          <div><strong>{featuredEvent ? formatDate(featuredEvent.eventDate) : '—'}</strong><span>Next date</span></div>
        </div>
        <p className="database-status connected">
          <i className="bi bi-arrow-repeat me-1"></i> Live event pool updates from the backend
        </p>
      </div>

      <div className="hero-panel" aria-live="polite" aria-label="Featured event details">
        <div className="hero-panel-main">
          <span className="hero-panel-tag">Featured event</span>
          <h2>{featuredEvent?.title || featuredEvent?.name || 'No upcoming events'}</h2>
          <p>
            {featuredEvent
              ? (featuredEvent.description || descriptions[featuredEvent.title || featuredEvent.name]
                || `Join us for this ${featuredEvent.category?.toLowerCase() || 'campus'} event.`)
              : 'Check back later for the next campus event listing.'}
          </p>
          <div className="hero-panel-meta">
            <span><i className="bi bi-geo-alt-fill me-1"></i>{featuredEvent?.venue || 'Venue pending'}</span>
            <span><i className="bi bi-calendar-event me-1"></i>{formatDate(featuredEvent?.eventDate, true)}</span>
          </div>
        </div>
        <div className="hero-panel-side">
          <span>Live event pool</span>
          <strong>{events.length}</strong>
          <small>events currently listed</small>
        </div>
      </div>
    </section>
  );
}
