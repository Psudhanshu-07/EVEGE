import React, { useEffect, useState } from 'react';

export default function RegistrationModal({ show, event, onClose, onSubmit }) {
  const [form, setForm] = useState({ studentName: '', studentEmail: '', collegeId: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setForm({ studentName: '', studentEmail: '', collegeId: '' });
      setError('');
    }
  }, [show, event]);

  if (!show || !event) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.studentEmail.trim() || !form.collegeId.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <div className="evege-modal-backdrop" onClick={onClose}>
      <div className="evege-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <span>
            <i className="bi bi-pencil-square me-2 text-warning"></i>
            Student Registration
          </span>
          <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="notice-strip mb-3">
              <i className="bi bi-info-circle"></i>
              <span>
                Event: <strong>{event.title}</strong> | Fee: <strong>₹100.00</strong>
              </span>
            </div>

            <div className="mb-3">
              <span className="form-label-sm">Student Name</span>
              <div className="input-wrap">
                <i className="bi bi-person"></i>
                <input
                  className="evege-input"
                  name="studentName"
                  value={form.studentName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <span className="form-label-sm">College Email</span>
              <div className="input-wrap">
                <i className="bi bi-envelope"></i>
                <input
                  className="evege-input"
                  type="email"
                  name="studentEmail"
                  value={form.studentEmail}
                  onChange={handleChange}
                  placeholder="name@college.edu"
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <span className="form-label-sm">College ID</span>
              <div className="input-wrap">
                <i className="bi bi-hash"></i>
                <input
                  className="evege-input"
                  name="collegeId"
                  value={form.collegeId}
                  onChange={handleChange}
                  placeholder="e.g. 23ENG1045"
                  required
                />
              </div>
            </div>

            {error && <div className="alert-evege mt-2">{error}</div>}
          </div>

          <div className="modal-ft">
            <button type="button" className="btn btn-outline-evege" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-pay fw-bold">
              Continue to Payment <i className="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
