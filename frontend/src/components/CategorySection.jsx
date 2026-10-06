import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: 'bi-grid-fill', color: 'primary' },
  { id: 'Technical', label: 'Technical', icon: 'bi-cpu-fill', color: 'primary', sub: 'Coding, Robotics & Hackathons' },
  { id: 'Sports', label: 'Sports', icon: 'bi-trophy-fill', color: 'success', sub: 'Cricket, Athletics & Leagues' },
  { id: 'Cultural', label: 'Cultural', icon: 'bi-music-note-beamed', color: 'warning', sub: 'Dance, Drama & Music Bands' }
];

export default function CategorySection({ events = [], onSelectEventForRegistration }) {
  const [selectedCategory, setSelectedCategory] = useState('Technical');
  const [searchQuery, setSearchQuery] = useState('');

  const safeEvents = Array.isArray(events) ? events : [];

  // Helper to normalize category name (e.g. 'Techfest' -> 'Technical')
  const normalizeCat = (cat) => {
    if (!cat) return 'Technical';
    const c = cat.toLowerCase();
    if (c.includes('tech')) return 'Technical';
    if (c.includes('sport')) return 'Sports';
    if (c.includes('cultur')) return 'Cultural';
    return cat;
  };

  const filteredEvents = safeEvents.filter((ev) => {
    const matchesCategory =
      selectedCategory === 'all' || normalizeCat(ev.category) === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      (ev.title && ev.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.venue && ev.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (catId) => {
    if (catId === 'all') return safeEvents.length;
    return safeEvents.filter((e) => normalizeCat(e.category) === catId).length;
  };

  return (
    <div className="category-section my-4">
      {/* Category header */}
      <div className="section-head mb-4 text-center">
        <span className="badge-pill-soft mb-2">Campus Happenings</span>
        <h3 className="section-heading fw-bold">Explore Events by Category</h3>
        <p className="text-muted small mx-auto" style={{ maxWidth: '600px' }}>
          Discover and register for technical hackathons, inter-college sports tournaments, and grand cultural festivals.
        </p>
      </div>

      {/* 3 Main Categories Cards + Tabs */}
      <div className="row g-3 mb-4">
        {CATEGORIES.slice(1).map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = getCategoryCount(cat.id);
          return (
            <div className="col-12 col-md-4" key={cat.id}>
              <div
                className={`category-summary-card ${cat.id.toLowerCase()}-card ${isSelected ? 'active-card' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className={`cat-icon-circle ${cat.id.toLowerCase()}-icon`}>
                    <i className={`bi ${cat.icon}`}></i>
                  </div>
                  <span className="cat-badge-counter">{count} Running Events</span>
                </div>
                <h5 className="fw-bold mb-1">{cat.label}</h5>
                <p className="text-muted small mb-2">{cat.sub}</p>
                <div className="cat-card-action">
                  <span className="small fw-semibold">
                    {isSelected ? 'Currently Viewing' : 'View Events'} &rarr;
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter bar: Search + Category Pills */}
      <div className="filter-controls-bar d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 p-3 rounded-3 shadow-sm bg-white">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`btn btn-cat-tab ${selectedCategory === c.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c.id)}
            >
              <i className={`bi ${c.icon} me-1`}></i>
              {c.label} ({getCategoryCount(c.id)})
            </button>
          ))}
        </div>

        <div className="search-wrap">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="form-control form-control-sm search-input"
            placeholder="Search events, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="empty-events-card text-center p-5 bg-white rounded-3 shadow-sm">
          <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
          <h5 className="fw-bold">No Events Found</h5>
          <p className="text-muted small">No active events found for the selected category or search query.</p>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
          >
            Show All Events
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {filteredEvents.map((ev) => {
            const cat = normalizeCat(ev.category);
            const themeClass =
              cat === 'Sports' ? 'card-theme-sports' : cat === 'Cultural' ? 'card-theme-cultural' : 'card-theme-tech';

            return (
              <div className="col-12 col-md-6 col-lg-4" key={ev.id}>
                <div className={`event-tile-card h-100 d-flex flex-column ${themeClass}`}>
                  {/* Card Banner / Poster */}
                  <div className="event-tile-banner">
                    <div className="banner-backdrop-pattern"></div>
                    <div className="banner-content-box">
                      <span className={`cat-pill ${cat.toLowerCase()}-pill`}>
                        <i className={`bi ${cat === 'Sports' ? 'bi-trophy' : cat === 'Cultural' ? 'bi-music-note' : 'bi-cpu'} me-1`}></i>
                        {cat}
                      </span>
                      <div className="banner-event-name">{ev.title}</div>
                      {ev.tagline && <div className="banner-tagline">{ev.tagline}</div>}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="event-tile-body p-3 flex-grow-1 d-flex flex-column justify-content-between">
                    <div>
                      <div className="meta-info-list mb-3">
                        <div className="meta-item">
                          <i className="bi bi-calendar-event text-primary"></i>
                          <span>{ev.eventDate || '30 August 2026'}</span>
                        </div>
                        <div className="meta-item">
                          <i className="bi bi-clock text-primary"></i>
                          <span>{ev.eventTime || '9:00 AM - 5:00 PM'}</span>
                        </div>
                        <div className="meta-item">
                          <i className="bi bi-geo-alt text-danger"></i>
                          <span className="text-truncate">{ev.venue || 'College Auditorium'}</span>
                        </div>
                      </div>

                      <p className="event-desc-snip text-muted small mb-3">
                        {ev.description || 'Join exciting competitions, workshops and activities.'}
                      </p>
                    </div>

                    {/* Bottom strip: Fee + Register Button */}
                    <div className="event-tile-footer pt-2 border-top d-flex align-items-center justify-content-between">
                      <div>
                        <div className="fee-label">Entry Fee</div>
                        <div className="fee-amount">₹{ev.registrationFee || 100}</div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-register-scan"
                        onClick={() => onSelectEventForRegistration(ev)}
                      >
                        <i className="bi bi-qr-code-scan me-1"></i> Register &amp; Pay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

