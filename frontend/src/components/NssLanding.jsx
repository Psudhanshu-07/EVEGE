import React, { useEffect, useState } from 'react';
import { nssSummary } from '../services/apiService';

const NSS_PHOTOS = [
  { src: '/images/shared-beach-cleanup.jpg', label: 'Beach cleanup drives' },
  { src: '/images/shared-tree-planting.jpg', label: 'Tree plantation' },
  { src: '/images/shared-community-outreach.jpg', label: 'Community outreach' }
];

const FALLBACK_PHOTO = '/images/shared-team-huddle.jpg';

/**_tryLocalizedPhoto: preferred asset, fall back to a bundled campus image if missing. */
function NssPhoto({ src, label }) {
  return (
    <div>
      <img
        className="nss-photo"
        src={src}
        alt={label}
        loading="lazy"
        onError={(e) => { if (!e.currentTarget.dataset.fell) { e.currentTarget.dataset.fell = '1'; e.currentTarget.src = FALLBACK_PHOTO; } else { e.currentTarget.style.visibility = 'hidden'; } }}
      />
      <div className="nss-caption">{label}</div>
    </div>
  );
}

export default function NssLanding({ currentUser, onBack, onBecomeVolunteer, onDashboard }) {
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    nssSummary()
      .then((r) => setSummary(r.data))
      .catch(() => setLoadError(true));
  }, []);

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to Home
      </button>

      <div className="feature-hero">
        <h2>National Service Scheme (NSS)</h2>
        <p>
          Not Me But You. NSS volunteers build cleaner campuses, greener neighbourhoods and stronger
          communities — earning verified service hours that count toward graduation certificates.
        </p>
      </div>

      <div className="feature-stats">
        <div className="feature-stat">
          <div className="num">{summary ? summary.approvedVolunteers : '—'}</div>
          <div className="lbl">Approved volunteers</div>
        </div>
        <div className="feature-stat">
          <div className="num">{summary ? summary.publishedTasks : '—'}</div>
          <div className="lbl">Open service tasks</div>
        </div>
        <div className="feature-stat">
          <div className="num">{summary ? summary.totalVerifiedHours : '—'}</div>
          <div className="lbl">Verified service hours</div>
        </div>
      </div>

      {loadError && (
        <div className="alert alert-warning py-2 small" role="alert">
          Live NSS counts are temporarily unavailable — the rest of this page is still accurate.
        </div>
      )}

      <div className="row g-4 align-items-start mt-1">
        <div className="col-lg-7">
          <div className="form-card">
            <h5 className="fw-bold mb-2">Why volunteer with NSS?</h5>
            <ul className="text-muted mb-3" style={{ lineHeight: 1.8 }}>
              <li><strong>Data credits:</strong> every verified hour is recorded and auditable.</li>
              <li><strong>Leadership:</strong> plan drives, coordinate teams, manage logistics.</li>
              <li><strong>Certificates:</strong> government-recognized service certification.</li>
              <li><strong>Community:</strong> work with NGOs, coastal groups and civic bodies.</li>
            </ul>
            <h6 className="fw-bold">Service categories</h6>
            <div className="task-chips">
              <span className="chip">🧹 Cleanliness Drives</span>
              <span className="chip">🌱 Environmental Protection</span>
              <span className="chip">🤝 Community Outreach</span>
              <span className="chip">📢 Awareness Campaigns</span>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="form-card text-center">
            <h6 className="fw-bold mb-1">Take the first step</h6>
            <p className="text-muted small mb-3">Apply in under two minutes. Track approval right here.</p>
            <button type="button" className="btn btn-primary-evege w-100 mb-2" onClick={onBecomeVolunteer}>
              <i className="bi bi-person-plus me-1"></i> Become an NSS Volunteer
            </button>
            {currentUser && (
              <button type="button" className="btn btn-ghost-evege w-100" onClick={onDashboard}>
                <i className="bi bi-speedometer2 me-1"></i> View My NSS Dashboard
              </button>
            )}
            {!currentUser && (
              <p className="text-muted small mb-0 mt-2">Sign in to see your volunteer dashboard.</p>
            )}
          </div>
        </div>
      </div>

      <div className="nss-photo-grid">
        {NSS_PHOTOS.map((p) => <NssPhoto key={p.src} src={p.src} label={p.label} />)}
      </div>
    </div>
  );
}
