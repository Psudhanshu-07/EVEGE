import React from 'react';

export default function MagazineNavbar({ currentView, setCurrentView, currentUser, onOpenAuth, onLogout }) {
  const go = (view) => setCurrentView(view);
  return (
    <header className="site-header" id="home">
      <nav className="site-nav" aria-label="Main navigation">
        <button type="button" className="brand brand-button" onClick={() => go('home')} aria-label="EVEGE home">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span className="brand-copy"><strong>TSDCEM</strong><small>College Magazine</small></span>
        </button>
        <div className="nav-links">
          <button type="button" className={currentView === 'home' ? 'nav-link-button active' : 'nav-link-button'} onClick={() => go('home')}>Home</button>
          <button type="button" className="nav-link-button" onClick={() => go('events')}>Events</button>
          <button type="button" className="nav-link-button" onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}>Gallery</button>
          <button type="button" className="nav-link-button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
          <span className="account-area">
            {currentUser ? (
              <>
                <span className="account-name" title={currentUser.email}>{currentUser.fullName || currentUser.email}</span>
                <button type="button" className="account-button" onClick={onLogout}>Sign out</button>
              </>
            ) : (
              <>
                <button type="button" className="account-link" onClick={() => onOpenAuth('student-login')}>Login</button>
                <button type="button" className="account-link account-register" onClick={() => onOpenAuth('student-register')}>Register</button>
              </>
            )}
          </span>
        </div>
      </nav>
    </header>
  );
}
