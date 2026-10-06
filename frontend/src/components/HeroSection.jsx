import React from 'react';

export default function HeroSection({ onExplore, onOpenRegister }) {
  return (
    <div className="evege-hero-container my-3 rounded-4 overflow-hidden shadow-sm">
      <div className="row g-0 align-items-stretch">
        {/* Left Dark Hero Section (matching reference image) */}
        <div className="col-12 col-lg-7 p-4 p-md-5 hero-dark-panel d-flex flex-column justify-content-between">
          <div>
            {/* Top Brand Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="hero-logo-box">
                <i className="bi bi-calendar2-star-fill text-primary fs-3"></i>
              </div>
              <div>
                <div className="hero-brand-name fw-bold text-white fs-3 lh-1">EVEGE</div>
                <div className="hero-brand-sub text-white-50 extra-small">EVENTS &bull; PEOPLE &bull; MEMORIES</div>
              </div>
              <div className="ms-auto d-none d-sm-block text-white-50 small border-start ps-3 border-secondary">
                Your College Events,<br />All in One Place.
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title text-white fw-bold mb-3 display-5">
              Plan. Manage.<br />
              <span className="text-primary-gradient">Experience.</span>
            </h1>

            <p className="hero-subtitle text-white-50 fs-6 mb-4" style={{ maxWidth: '480px' }}>
              A simple platform to discover, register and manage college events.
            </p>

            {/* 3 Value Proposition Bullets */}
            <div className="hero-feature-list d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-start gap-3">
                <div className="feature-icon-circle">
                  <i className="bi bi-calendar2-week"></i>
                </div>
                <div>
                  <div className="text-white fw-bold small">Discover Events</div>
                  <div className="text-white-50 extra-small">Explore exciting events happening on campus.</div>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="feature-icon-circle">
                  <i className="bi bi-people"></i>
                </div>
                <div>
                  <div className="text-white fw-bold small">Register Easily</div>
                  <div className="text-white-50 extra-small">Sign up for your favourite events in just a few clicks.</div>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="feature-icon-circle">
                  <i className="bi bi-star"></i>
                </div>
                <div>
                  <div className="text-white fw-bold small">Stay Updated</div>
                  <div className="text-white-50 extra-small">Get the latest updates, notifications and reminders.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cursive Quote */}
          <div className="hero-bottom-tag mt-3 d-flex justify-content-between align-items-center">
            <span className="cursive-tagline">More Events. More Connections.</span>
            <button type="button" className="btn btn-primary btn-sm px-3 shadow" onClick={onExplore}>
              Explore Events &rarr;
            </button>
          </div>
        </div>

        {/* Right Preview Card / Banner */}
        <div className="col-12 col-lg-5 p-4 p-md-5 hero-light-panel d-flex flex-column justify-content-center bg-white">
          <div className="quick-access-box p-4 rounded-4 shadow-sm border text-center">
            <div className="quick-avatar-badge mx-auto mb-3">
              <i className="bi bi-mortarboard-fill text-primary fs-2"></i>
            </div>
            <h4 className="fw-bold mb-1">Campus Event Portal</h4>
            <p className="text-muted small mb-4">
              Discover running Technical fests, Sports leagues, and Cultural celebrations.
            </p>

            <div className="d-grid gap-2 mb-3">
              <button
                type="button"
                className="btn btn-primary fw-bold py-2 shadow-sm"
                onClick={onOpenRegister}
              >
                <i className="bi bi-person-plus me-1"></i> Create Student Account &rarr;
              </button>
              <button
                type="button"
                className="btn btn-outline-primary py-2"
                onClick={onExplore}
              >
                <i className="bi bi-grid me-1"></i> Browse Categories &amp; Events
              </button>
            </div>

            <div className="security-notice small text-muted">
              <i className="bi bi-database-check text-success me-1"></i>
              PostgreSQL Database Sync Enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

