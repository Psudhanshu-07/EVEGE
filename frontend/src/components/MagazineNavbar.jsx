import React from 'react';

export default function MagazineNavbar({ currentView, setCurrentView, currentUser, onOpenAuth, onLogout }) {
  const handleNav = (targetId) => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="site-header" id="home">
      <nav className="site-nav" aria-label="Main navigation">
        <button
          type="button"
          className="brand brand-button"
          onClick={() => handleNav('home')}
          aria-label="TSDCEM College Magazine home"
        >
          <img
            src="/images/tsdcem-logo.png"
            alt="TSDCEM Logo"
            className="brand-crest-img"
          />
          <span className="brand-copy">
            <strong>TSDCEM</strong>
            <small>COLLEGE MAGAZINE</small>
          </span>
        </button>
        <div className="nav-links">
          <button
            type="button"
            className={currentView === 'home' ? 'nav-link-button active' : 'nav-link-button'}
            onClick={() => handleNav('home')}
          >
            Home
          </button>
          <button
            type="button"
            className="nav-link-button"
            onClick={() => handleNav('events')}
          >
            Events
          </button>
          <button
            type="button"
            className={currentView === 'scheduling' ? 'nav-link-button active' : 'nav-link-button'}
            onClick={() => setCurrentView('scheduling')}
          >
            <i className="bi bi-calendar2-check me-1"></i>Plan My Day
          </button>
          <button
            type="button"
            className={currentView === 'leaderboard' ? 'nav-link-button active' : 'nav-link-button'}
            onClick={() => setCurrentView('leaderboard')}
          >
            <i className="bi bi-trophy me-1"></i>Leaderboard
          </button>
          <button
            type="button"
            className={currentView === 'nss' ? 'nav-link-button active' : 'nav-link-button'}
            onClick={() => setCurrentView('nss')}
          >
            NSS
          </button>
          <button
            type="button"
            className="nav-link-button"
            onClick={() => handleNav('gallery')}
          >
            Gallery
          </button>
          <button
            type="button"
            className="nav-link-button"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Contact
          </button>
          <div className="account-area">
            {currentUser ? (
              <>
                {/* Identity chip: avatar initials + name + role badge */}
                <span className="account-chip" title={currentUser.email}>
                  <span className="account-avatar">
                    {(currentUser.fullName || currentUser.email || '?')
                      .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                  <span className="account-meta">
                    <span className="account-name">
                      {currentUser.fullName || currentUser.email}
                    </span>
                    <span className={`account-role ${currentUser.role === 'ADMIN' ? 'role-admin' : 'role-student'}`}>
                      {currentUser.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'}
                    </span>
                  </span>
                </span>
                <span className="account-divider" aria-hidden="true"></span>
                {/* Role-specific quick actions */}
                {currentUser.role === 'ADMIN' ? (
                  <>
                    <button
                      type="button"
                      className={currentView === 'admin' ? 'nav-link-button account-action active' : 'nav-link-button account-action'}
                      onClick={() => setCurrentView('admin')}
                    >
                      <i className="bi bi-gear me-1"></i>Admin Portal
                    </button>
                    <button
                      type="button"
                      className={currentView === 'admin-nss' ? 'nav-link-button account-action active' : 'nav-link-button account-action'}
                      onClick={() => setCurrentView('admin-nss')}
                    >
                      <i className="bi bi-stars me-1"></i>NSS & Scoring
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={currentView === 'my-registrations' ? 'nav-link-button account-action active' : 'nav-link-button account-action'}
                    onClick={() => setCurrentView('my-registrations')}
                  >
                    <i className="bi bi-ticket-perforated me-1"></i>My Passes
                  </button>
                )}
                <button
                  type="button"
                  className="account-signout"
                  onClick={onLogout}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="account-link"
                  onClick={() => onOpenAuth('student-login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="account-link account-register"
                  onClick={() => onOpenAuth('student-register')}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
