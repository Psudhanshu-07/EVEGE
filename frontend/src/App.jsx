import React, { useEffect, useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CategorySection from './components/CategorySection';
import PaymentScannerPage from './components/PaymentScannerPage';
import AdminPanel from './components/AdminPanel';
import MyRegistrations from './components/MyRegistrations';
import AuthModal from './components/AuthModal';
import {
  fetchEvents,
  fetchStats,
  fetchRegistrations,
  fetchCurrentUser
} from './services/apiService';

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'events', 'my-registrations', 'admin', 'payment'
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Authentication State with defensive localStorage parsing (defaults to null until login)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('evege_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.email) {
          return parsed;
        }
      }
    } catch {
      // not logged in
    }
    return null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('student-register');
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch events, stats, registrations from PostgreSQL backend
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const regsPromise = currentUser?.email
        ? fetchRegistrations(currentUser.email).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] });

      const [eventsRes, statsRes, regsRes] = await Promise.all([
        fetchEvents().catch(() => ({ data: [] })),
        fetchStats().catch(() => ({ data: null })),
        regsPromise
      ]);
      setEvents(Array.isArray(eventsRes?.data) ? eventsRes.data : []);
      setStats(statsRes?.data || null);
      setRegistrations(Array.isArray(regsRes?.data) ? regsRes.data : []);
    } catch (err) {
      setBanner({
        type: 'danger',
        text: 'Backend connection pending. Check that PostgreSQL and Spring Boot are running.'
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Handle open auth modal
  const handleOpenAuth = (mode = 'student-register') => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  };

  // Handle login success
  const handleLoginSuccess = (user, type) => {
    setCurrentUser(user);
    if (user.role === 'ADMIN' || type === 'admin') {
      // User requirement: Admin redirects directly to manage events page!
      setCurrentView('admin');
      setBanner({
        type: 'success',
        text: 'Welcome Administrator! You can now manage campus events and inspect database records.'
      });
    } else {
      setBanner({
        type: 'success',
        text: `Welcome back, ${user.fullName || user.email}! Explore events and register.`
      });
      loadAll();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('evege_token');
    localStorage.removeItem('evege_user');
    setCurrentUser(null);
    setCurrentView('home');
    setBanner({
      type: 'info',
      text: 'You have been logged out.'
    });
  };

  // Triggered when student clicks "Register & Pay" on any event card
  const handleSelectEventForRegistration = (event) => {
    setSelectedEvent(event);
    setCurrentView('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Triggered when payment/registration is submitted
  const handleRegistrationComplete = (newReg) => {
    setRegistrations((prev) => [newReg, ...prev]);
    setBanner({
      type: 'success',
      text: `Registration recorded in PostgreSQL! You are confirmed for ${newReg.eventTitle}.`
    });
    loadAll();
  };

  return (
    <div className="evege-app-root d-flex flex-column min-vh-100">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        registrationCount={registrations.length}
      />

      {/* Main Page Content */}
      <main className="container-fluid px-4 flex-grow-1 page-main-shell">
        {/* Banner Alert */}
        {banner && (
          <div className={`alert alert-${banner.type} alert-dismissible fade show my-3 shadow-sm`} role="alert">
            <i className={`bi bi-${banner.type === 'success' ? 'check-circle-fill' : 'info-circle-fill'} me-2`}></i>
            <span>{banner.text}</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => setBanner(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* VIEW: PAYMENT & SCANNER FLOW (Matches bottom reference image) */}
        {currentView === 'payment' && selectedEvent && (
          <PaymentScannerPage
            event={selectedEvent}
            currentUser={currentUser}
            onBack={() => {
              setSelectedEvent(null);
              setCurrentView('home');
            }}
            onRegistrationComplete={handleRegistrationComplete}
          />
        )}

        {/* VIEW: ADMIN PANEL (Direct redirect on admin login) */}
        {currentView === 'admin' && (
          <AdminPanel onBackToHome={() => setCurrentView('home')} />
        )}

        {/* VIEW: MY REGISTRATIONS (Only visible when logged in) */}
        {currentView === 'my-registrations' && (
          currentUser ? (
            <MyRegistrations
              currentUser={currentUser}
              onBrowseEvents={() => setCurrentView('home')}
            />
          ) : (
            <div className="card p-5 my-4 text-center border-0 shadow-sm rounded-4 bg-white">
              <i className="bi bi-shield-lock fs-1 text-primary mb-3"></i>
              <h4 className="fw-bold">Student Sign-In Required</h4>
              <p className="text-muted small mb-4">Please log in to your student account to view your confirmed event passes and registrations.</p>
              <div>
                <button
                  type="button"
                  className="btn btn-primary px-4 fw-bold shadow-sm"
                  onClick={() => handleOpenAuth('student-login')}
                >
                  <i className="bi bi-person me-1"></i> Sign In as Student
                </button>
              </div>
            </div>
          )
        )}

        {/* VIEW: HOME (Hero + 3 Main Categories + Running Events) */}
        {(currentView === 'home' || currentView === 'events') && (
          <>
            {currentView === 'home' && (
              <HeroSection
                onExplore={() => {
                  const elem = document.getElementById('category-section-anchor');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                onOpenRegister={() => handleOpenAuth('student-register')}
              />
            )}

            <div id="category-section-anchor">
              <CategorySection
                events={events}
                onSelectEventForRegistration={handleSelectEventForRegistration}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="evege-footer py-3 border-top mt-auto text-center">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <img src="/logo.svg" alt="EVEGE Logo" style={{ width: '22px', height: '22px', borderRadius: '6px' }} />
            <span className="fw-bold">EVEGE</span>
            <span className="text-muted extra-small">&bull; College Event Management System</span>
          </div>
          <div className="text-muted extra-small">
            Connected to PostgreSQL &bull; Spring Boot 3 Backend
          </div>
          <div className="cursive-tagline extra-small">More Events. More Connections.</div>
        </div>
      </footer>

      {/* Auth Modal (Register / Login / Admin) */}
      <AuthModal
        show={showAuthModal}
        initialMode={authInitialMode}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
