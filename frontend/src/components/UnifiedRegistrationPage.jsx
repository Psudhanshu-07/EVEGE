import React, { useMemo, useState } from 'react';
import { unifiedRegister } from '../services/apiService';

/**
 * Unified Registration for College & External students.
 * Division for internal students is derived server-side from trusted profile
 * data and is NOT editable here — the field is display-only.
 */
export default function UnifiedRegistrationPage({ event, currentUser, onBack, onRegistered, onOpenAuth, onPayInstead }) {
  const [type, setType] = useState('COLLEGE');
  const [form, setForm] = useState({
    fullName: '',
    studentEmail: currentUser?.email || '',
    mobile: '',
    collegeName: '',
    rollNumber: currentUser?.rollNumber || '',
    branch: currentUser?.branch || '',
    academicYear: currentUser?.yearSemester || ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const isExternal = type === 'EXTERNAL';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.studentEmail.trim() || !form.studentEmail.includes('@')) errs.studentEmail = 'A valid email is required.';
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required.';
    if (isExternal && !form.collegeName.trim()) errs.collegeName = 'College name is required for external students.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        participantType: type,
        eventId: event.id,
        fullName: form.fullName.trim(),
        studentEmail: form.studentEmail.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        collegeName: isExternal ? form.collegeName.trim() : null,
        rollNumber: !isExternal ? form.rollNumber.trim() : null,
        branch: !isExternal ? form.branch.trim() : null,
        academicYear: form.academicYear.trim() || null
      };
      const res = await unifiedRegister(payload);
      setConfirmation(res.data);
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!event) {
    return (
      <div className="feature-shell"><div className="form-card text-center py-5">No event selected.</div></div>
    );
  }

  if (confirmation) {
    return (
      <div className="feature-shell">
        <div className="form-card text-center py-5" role="status" aria-live="polite">
          <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
          <h3 className="fw-bold mt-3">You're registered!</h3>
          <p className="text-muted">{confirmation.eventTitle}</p>
          <div className="mx-auto text-start" style={{ maxWidth: 420 }}>
            <table className="table table-sm">
              <tbody>
                <tr><th className="w-25">Participant</th><td>{confirmation.studentName}</td></tr>
                <tr><th>Type</th><td>{type === 'EXTERNAL' ? 'External Student' : 'College Student'}</td></tr>
                <tr><th>Fee</th><td>₹{Number(confirmation.amount || 100).toFixed(2)}</td></tr>
                <tr><th>UTR</th><td className="text-muted">{confirmation.transactionRef}</td></tr>
                <tr><th>Status</th><td><span className="chip yes">{confirmation.paymentStatus}</span></td></tr>
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-primary-evege mt-2" onClick={onBack}>Back to Events</button>
          <button type="button" className="btn btn-ghost-evege mt-2 ms-2" onClick={onPayInstead}>
            <i className="bi bi-qr-code me-1"></i> Pay with UPI QR scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to Events
      </button>

      <div className="feature-hero mb-4">
        <h2>Register for {event.title}</h2>
        <p>
          {event.eventDate} · {event.eventTime} · {event.venue} · Fee ₹{Number(event.registrationFee || 100).toFixed(2)}
        </p>
      </div>

      <div className="form-card">
        <h5 className="fw-bold mb-3">Who are you registering as?</h5>
        <div className="part-type-toggle" role="radiogroup" aria-label="Participant type">
          <button
            type="button"
            className={type === 'COLLEGE' ? 'part-type-btn active' : 'part-type-btn'}
            onClick={() => setType('COLLEGE')}
            role="radio"
            aria-checked={type === 'COLLEGE'}
          >
            🎓 College Student
            <span className="sub">Roll number & division managed by the college.</span>
          </button>
          <button
            type="button"
            className={type === 'EXTERNAL' ? 'part-type-btn active' : 'part-type-btn'}
            onClick={() => setType('EXTERNAL')}
            role="radio"
            aria-checked={type === 'EXTERNAL'}
          >
            🌐 External Student
            <span className="sub">From another institution — division not applicable.</span>
          </button>
        </div>

        <div className={`scope-banner ${isExternal ? 'external' : 'internal'}`}>
          {isExternal
            ? 'External participants: division is not applicable and branch is optional.'
            : 'College students: division and branch come from your verified student profile for fair leaderboards.'}
        </div>

        {!currentUser && (
          <div className="mb-3">
            <button type="button" className="btn btn-ghost-evege btn-sm-evege" onClick={onOpenAuth}>
              <i className="bi bi-box-arrow-in-right me-1"></i> Sign in first — fields below will be prefilled
            </button>
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="reg-name">Full Name *</label>
              <input id="reg-name" className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                     value={form.fullName} onChange={set('fullName')} autoComplete="name" />
              <div className="invalid-feedback">{errors.fullName}</div>
            </div>
            <div className="col-md-6">
              <label htmlFor="reg-email">Student Email *</label>
              <input id="reg-email" type="email" className={`form-control ${errors.studentEmail ? 'is-invalid' : ''}`}
                     value={form.studentEmail} onChange={set('studentEmail')} autoComplete="email" />
              <div className="invalid-feedback">{errors.studentEmail}</div>
            </div>
            <div className="col-md-6">
              <label htmlFor="reg-mobile">Mobile Number *</label>
              <input id="reg-mobile" className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                     value={form.mobile} onChange={set('mobile')} autoComplete="tel" />
              <div className="invalid-feedback">{errors.mobile}</div>
            </div>

            {isExternal ? (
              <div className="col-md-6">
                <label htmlFor="reg-college">College Name *</label>
                <input id="reg-college" className={`form-control ${errors.collegeName ? 'is-invalid' : ''}`}
                       value={form.collegeName} onChange={set('collegeName')} />
                <div className="invalid-feedback">{errors.collegeName}</div>
              </div>
            ) : (
              <>
                <div className="col-md-4">
                  <label htmlFor="reg-roll">Roll Number</label>
                  <input id="reg-roll" className="form-control" value={form.rollNumber} onChange={set('rollNumber')} />
                </div>
                <div className="col-md-4">
                  <label htmlFor="reg-branch">Department / Branch</label>
                  <input id="reg-branch" className="form-control" value={form.branch} onChange={set('branch')} />
                </div>
                <div className="col-md-4">
                  <label htmlFor="reg-div">Division (from profile)</label>
                  <input className="form-control" value="Derived securely — not editable" readOnly disabled />
                </div>
              </>
            )}

            <div className="col-md-6">
              <label htmlFor="reg-year">Academic Year</label>
              <select id="reg-year" className="form-select" value={form.academicYear} onChange={set('academicYear')}>
                <option value="">Select year…</option>
                <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
              </select>
            </div>
          </div>

          {serverError && <div className="alert alert-danger mt-3 mb-0 py-2">{serverError}</div>}

          <div className="d-flex gap-2 mt-4 flex-wrap">
            <button type="submit" className="btn btn-primary-evege" disabled={saving}>
              {saving ? 'Registering…' : `Register & Pay ₹${Number(event.registrationFee || 100).toFixed(2)}`}
            </button>
            <button type="button" className="btn btn-ghost-evege" onClick={onBack}>Cancel</button>
            {onPayInstead && (
              <button type="button" className="btn btn-ghost-evege" onClick={onPayInstead}>
                <i className="bi bi-qr-code me-1"></i> Pay with UPI QR scanner instead
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
