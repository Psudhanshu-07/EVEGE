import React from 'react';

export default function Navbar({ currentView, setCurrentView, currentUser, onOpenAuth, onLogout, registrationCount }) {
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <nav className="evege-navbar">
      <div className="container-fluid px-4 d-flex align-items-center justify-content-between gap-3">
        {/* Brand Logo */}
        <div className="evege-brand-header d-flex align-items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="logo-icon-box">
            <i className="bi bi-calendar2-star-fill"></i>
          </div>
          <div className="logo-text-group">
            <div className="logo-main-row">
              <span className="logo-title">EVEGE</span>
              <span className="logo-tagline-desktop d-none d-md-inline ms-3">
                Your College Events, All in One Place.
              </span>
            </div>
            <div className="logo-sub">EVENTS &bull; PEOPLE &bull; MEMORIES</div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            type="button"
            className={`evege-nav-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentView('home')}
          >
            <i className="bi bi-house-door me-1"></i> Home
          </button>

          <button
            type="button"
            className={`evege-nav-btn ${currentView === 'events' ? 'active' : ''}`}
            onClick={() => setCurrentView('events')}
          >
            <i className="bi bi-grid-fill me-1"></i> Events
          </button>

          <button
            type="button"
            className={`evege-nav-btn ${currentView === 'my-registrations' ? 'active' : ''}`}
            onClick={() => setCurrentView('my-registrations')}
          >
            <i className="bi bi-ticket-perforated me-1"></i> My Registrations
            {registrationCount > 0 && <span className="nav-badge ms-1">{registrationCount}</span>}
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`evege-nav-btn admin-badge-btn ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              <i className="bi bi-shield-lock-fill me-1"></i> Admin Panel
            </button>
          )}

          {/* User profile / Login */}
          {currentUser ? (
            <div className="user-pill d-flex align-items-center gap-2">
              <div className={`user-avatar ${isAdmin ? 'admin-avatar' : ''}`}>
                {isAdmin ? 'AD' : (currentUser?.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : 'ST')}
              </div>
              <div className="user-info-text text-start d-none d-sm-block">
                <div className="user-name">{currentUser?.fullName || currentUser?.email || 'User'}</div>
                <div className="user-role-label">{isAdmin ? 'Administrator' : 'Student'}</div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-logout-icon ms-1"
                onClick={onLogout}
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-evege-login btn-sm"
                onClick={() => onOpenAuth('student-login')}
              >
                <i className="bi bi-person me-1"></i> Login
              </button>
              <button
                type="button"
                className="btn btn-evege-register btn-sm"
                onClick={() => onOpenAuth('student-register')}
              >
                Register
              </button>
              <button
                type="button"
                className="btn btn-outline-warning btn-sm"
                onClick={() => onOpenAuth('admin-login')}
                title="Admin Portal"
              >
                <i className="bi bi-shield-lock"></i> Admin
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

