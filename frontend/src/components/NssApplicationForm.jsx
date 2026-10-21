import React, { useEffect, useState } from 'react';
import { nssApply, nssStatus, nssWithdraw } from '../services/apiService';

const STATES = ['NOT_REGISTERED', 'PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'];

export default function NssApplicationForm({ currentUser, onBack, onDashboard }) {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    studentId: currentUser?.rollNumber || '',
    phone: currentUser?.phone || '',
    branch: currentUser?.branch || '',
    academicYear: currentUser?.yearSemester || '',
    experience: '',
    availability: '',
    motivation: '',
    consentGiven: false
  });
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(true);

  const set = (k) => (e) => {
    const v = k === 'consentGiven' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const loadStatus = async () => {
    if (!currentUser?.email) { setLoading(false); return; }
    try {
      const r = await nssStatus(currentUser.email);
      setStatus(r.data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, [currentUser?.email]);

  const state = status?.state || 'NOT_REGISTERED';

  const submit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!form.fullName.trim() || !form.motivation.trim() || !form.consentGiven) {
      setServerError('Name, motivation and consent are all required.');
      return;
    }
    setSaving(true);
    try {
      await nssApply({ ...form, email: currentUser?.email });
      await loadStatus();
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Could not submit the application.');
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    if (!window.confirm('Withdraw your NSS application? You can reapply later.')) return;
    try {
      await nssWithdraw();
      await loadStatus();
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Could not withdraw.');
    }
  };

  if (!currentUser) {
    return (
      <div className="feature-shell">
        <div className="form-card text-center py-5">
          <i className="bi bi-shield-lock fs-1 text-primary mb-3 d-block"></i>
          <h4 className="fw-bold">Sign in to join NSS</h4>
          <p className="text-muted">Volunteer applications are tied to your student account.</p>
          <button type="button" className="btn btn-primary-evege" onClick={onBack}>Back to NSS</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="feature-shell"><div className="form-card py-5 text-center">Loading status…</div></div>;
  }

  return (
    <div className="feature-shell">
      <button type="button" className="feature-back" onClick={onBack}>
        <i className="bi bi-arrow-left me-1"></i> Back to NSS
      </button>

      <h2 className="fw-bold mb-3">NSS Volunteer Application</h2>

      <div className="mb-3">
        <span className={`nss-status ${state.toLowerCase()}`}>
          <i className={state === 'APPROVED' ? 'bi bi-check-circle-fill' : state === 'PENDING' ? 'bi bi-hourglass-split' : 'bi bi-person'}></i>
          {STATES.includes(state) ? state.replace('_', ' ') : state}
        </span>
      </div>

      {serverError && <div className="alert alert-danger py-2">{serverError}</div>}

      {(state === 'PENDING' || state === 'APPROVED') && (
        <div className="form-card mb-3">
          <h6 className="fw-bold">{state === 'APPROVED' ? '✅ You are an approved volunteer!' : '⏳ Application under review'}</h6>
          {status?.application?.adminNote && (
            <p className="text-muted small mb-0">Admin note: “{status.application.adminNote}”</p>
          )}
          {state === 'APPROVED' && (
            <button type="button" className="btn btn-primary-evege mt-3" onClick={onDashboard}>
              <i className="bi bi-speedometer2 me-1"></i> Go to My Dashboard
            </button>
          )}
          {state === 'PENDING' && (
            <button type="button" className="btn btn-ghost-evege btn-sm-evege mt-3" onClick={withdraw}>
              <i className="bi bi-x-circle me-1"></i> Withdraw application
            </button>
          )}
        </div>
      )}

      {(state === 'NOT_REGISTERED' || state === 'REJECTED' || state === 'WITHDRAWN') && (
        <form className="form-card" onSubmit={submit} noValidate>
          {state === 'REJECTED' && status?.application?.adminNote && (
            <div className="scope-banner external">Previous decision: {status.application.adminNote}</div>
          )}
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="nss-name">Full name *</label>
              <input id="nss-name" className="form-control" value={form.fullName} onChange={set('fullName')} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="nss-id">Student ID / Roll no.</label>
              <input id="nss-id" className="form-control" value={form.studentId} onChange={set('studentId')} />
            </div>
            <div className="col-md-6">
              <label htmlFor="nss-phone">Mobile number</label>
              <input id="nss-phone" className="form-control" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="col-md-6">
              <label htmlFor="nss-branch">Branch / Department</label>
              <input id="nss-branch" className="form-control" value={form.branch} onChange={set('branch')} />
            </div>
            <div className="col-md-6">
              <label htmlFor="nss-year">Academic year</label>
              <input id="nss-year" className="form-control" value={form.academicYear} onChange={set('academicYear')} />
            </div>
            <div className="col-md-6">
              <label htmlFor="nss-avail">Availability (e.g. weekends)</label>
              <input id="nss-avail" className="form-control" value={form.availability} onChange={set('availability')} />
            </div>
            <div className="col-12">
              <label htmlFor="nss-exp">Relevant experience or interests</label>
              <textarea id="nss-exp" className="form-control" rows={2} value={form.experience} onChange={set('experience')} />
            </div>
            <div className="col-12">
              <label htmlFor="nss-mot">Motivation for joining *
                <span className="text-muted fw-normal"> (students should give their own words)</span>
              </label>
              <textarea id="nss-mot" className="form-control" rows={3} value={form.motivation} onChange={set('motivation')} required />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input id="nss-consent" type="checkbox" className="form-check-input" checked={form.consentGiven} onChange={set('consentGiven')} />
                <label className="form-check-label small" htmlFor="nss-consent">
                  I consent to NSS volunteer participation and my service hours being recorded. *
                </label>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary-evege mt-3" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      )}
    </div>
  );
}
