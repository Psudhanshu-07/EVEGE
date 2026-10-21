import React, { useEffect, useState, useCallback } from 'react';
import MagazineNavbar from './components/MagazineNavbar';
import HeroSection from './components/HeroSection';
import StoryStrip from './components/StoryStrip';
import GallerySection from './components/GallerySection';
import MagazineEvents from './components/MagazineEvents';
import PaymentScannerPage from './components/PaymentScannerPage';
import AdminPanel from './components/AdminPanel';
import MyRegistrations from './components/MyRegistrations';
import AuthModal from './components/AuthModal';
import SchedulingAssistant from './components/SchedulingAssistant';
import UnifiedRegistrationPage from './components/UnifiedRegistrationPage';
import NssLanding from './components/NssLanding';
import NssApplicationForm from './components/NssApplicationForm';
import NssVolunteerDashboard from './components/NssVolunteerDashboard';
import NssTaskDetail from './components/NssTaskDetail';
import LeaderboardPage from './components/LeaderboardPage';
import AdminNssPanel from './components/AdminNssPanel';
import { nssSeedDemo } from './services/apiService';
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
  const [nssTaskId, setNssTaskId] = useState(null);
  const [leaderboardCategory, setLeaderboardCategory] = useState('Sports');

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
    setCurrentView('unified-register'); // unified college/external flow (replaces legacy payment view)
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

  // Seed demo NSS tasks (must be signed-in admin) so the admin panel has reviewable data.
  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      nssSeedDemo().catch(() => {});
    }
  }, [currentUser?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="evege-app-root d-flex flex-column min-vh-100">
      {/* Navbar */}
      <MagazineNavbar currentView={currentView} setCurrentView={setCurrentView} currentUser={currentUser} onOpenAuth={handleOpenAuth} onLogout={handleLogout} />

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

        {/* VIEW: ADMIN NSS + SCORING EXTENSION */}
        {currentView === 'admin-nss' && (
          <AdminNssPanel onBackToHome={() => setCurrentView('admin')} />
        )}

        {/* VIEW: SCHEDULING ASSISTANT */}
        {currentView === 'scheduling' && (
          <SchedulingAssistant
            events={events}
            onBack={() => setCurrentView('events')}
            onRegister={(eventLike) => {
              const full = events.find((e) => e.id === eventLike.eventId);
              if (full) handleSelectEventForRegistration(full);
              else window.alert('Full event details could not be found for registration.');
            }}
          />
        )}

        {/* VIEW: UNIFIED REGISTRATION */}
        {currentView === 'unified-register' && selectedEvent && (
          <UnifiedRegistrationPage
            event={selectedEvent}
            currentUser={currentUser}
            onBack={() => {
              setSelectedEvent(null);
              setCurrentView('events');
              loadAll();
            }}
            onOpenAuth={() => handleOpenAuth('student-login')}
            onPayInstead={() => setCurrentView('payment')}
          />
        )}

        {/* VIEW: NSS LANDING */}
        {currentView === 'nss' && (
          <NssLanding
            currentUser={currentUser}
            onBack={() => setCurrentView('home')}
            onBecomeVolunteer={() => setCurrentView('nss-apply')}
            onDashboard={() => setCurrentView('nss-dashboard')}
          />
        )}

        {/* VIEW: NSS APPLICATION */}
        {currentView === 'nss-apply' && (
          <NssApplicationForm
            currentUser={currentUser}
            onBack={() => setCurrentView('nss')}
            onDashboard={() => setCurrentView('nss-dashboard')}
          />
        )}

        {/* VIEW: NSS VOLUNTEER DASHBOARD */}
        {currentView === 'nss-dashboard' && (
          <NssVolunteerDashboard
            currentUser={currentUser}
            onBack={() => setCurrentView('nss')}
            onOpenTask={(t) => { setNssTaskId(t.id); setCurrentView('nss-task'); }}
          />
        )}

        {/* VIEW: NSS TASK DETAIL */}
        {currentView === 'nss-task' && nssTaskId != null && (
          <NssTaskDetail
            currentUser={currentUser}
            taskId={nssTaskId}
            onBack={() => setCurrentView('nss-dashboard')}
          />
        )}

        {/* VIEW: CATEGORY LEADERBOARD */}
        {currentView === 'leaderboard' && (
          <LeaderboardPage
            category={leaderboardCategory}
            currentUser={currentUser}
            onBack={() => setCurrentView('home')}
            onPickCategory={(c) => setLeaderboardCategory(c)}
          />
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
                events={events}
                onExplore={() => {
                  const elem = document.getElementById('category-section-anchor');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                onOpenRegister={() => handleOpenAuth('student-register')}
              />
            )}

            {currentView === 'home' && <StoryStrip />}

            <MagazineEvents events={events} onRegister={handleSelectEventForRegistration} />
            {currentView === 'home' && <GallerySection events={events} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer" id="contact">
        <div className="footer-main">
          <div className="footer-col footer-col-brand">
            <a className="footer-brand" href="#home">TSDCEM</a>
            <p className="footer-tagline">Making campus moments happen.</p>
            <p className="footer-note small">
              Questions? Reach out to your student event coordinator.
            </p>
          </div>
          <div className="footer-col">
            <h6 className="footer-col-title">Official</h6>
            <a
              className="footer-link"
              href="https://www.tsdcem.ac.in/"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="bi bi-globe2 me-2"></i>College Website
            </a>
            <a
              className="footer-link"
              href="https://youtube.com/@tsdcem"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="bi bi-youtube me-2"></i>YouTube Channel
            </a>
          </div>
          <div className="footer-col">
            <h6 className="footer-col-title">Social</h6>
            <a
              className="footer-link"
              href="https://www.instagram.com/tsdcem"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="bi bi-instagram me-2"></i>College Instagram
            </a>
            <a
              className="footer-link"
              href="https://www.instagram.com/tsdcem_ecell"
              target="_blank"
              rel="noreferrer noopener"
            >
              <i className="bi bi-lightning-charge me-2"></i>E-Cell Instagram
            </a>
          </div>
        </div>
        <div className="footer-rule"></div>
        <span>&copy; 2026 TSDCEM College Magazine &middot; Powered by EVEGE</span>
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
