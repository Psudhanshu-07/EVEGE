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
          <span className="brand-mark" aria-hidden="true">T</span>
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
          <span className="account-area">
            {currentUser ? (
              <>
                {currentUser.role === 'ADMIN' ? (
                  <button
                    type="button"
                    className="account-link text-warning"
                    onClick={() => setCurrentView('admin')}
                  >
                    Admin Portal
                  </button>
                ) : (
                  <button
                    type="button"
                    className="account-link"
                    onClick={() => setCurrentView('my-registrations')}
                  >
                    My Passes
                  </button>
                )}
                <span className="account-name" title={currentUser.email}>
                  {currentUser.fullName || currentUser.email}
                </span>
                <button type="button" className="account-button" onClick={onLogout}>
                  Sign out
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
          </span>
        </div>
      </nav>
    </header>
  );
}
