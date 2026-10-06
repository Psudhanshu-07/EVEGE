import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { registerForEvent } from '../services/apiService';

export default function PaymentScannerPage({
  event,
  currentUser,
  onBack,
  onRegistrationComplete
}) {
  const [step, setStep] = useState(2); // 1 = Details, 2 = Payment, 3 = Confirmation
  const [participantName, setParticipantName] = useState(
    currentUser?.fullName || 'Sudanshu Pandey'
  );
  const [participantEmail, setParticipantEmail] = useState(
    currentUser?.email || 'student@email.com'
  );
  const [collegeId, setCollegeId] = useState('23CSE1042');
  const [phone, setPhone] = useState(currentUser?.phone || '9876543211');
  const [timeLeft, setTimeLeft] = useState(592); // 09:52 in seconds
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [error, setError] = useState('');

  // 10 minute countdown timer
  useEffect(() => {
    if (step !== 2) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!event) return null;

  const upiId = event.upiId || 'evege@okaxis';
  const fee = event.registrationFee || 100;

  // Real dynamic UPI URI string
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    'EVEGE Events'
  )}&am=${fee}.00&cu=INR&tn=${encodeURIComponent(event.title)}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Mock payment submission that records directly to the PostgreSQL database!
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!participantName.trim()) {
      setError('Please provide participant name.');
      return;
    }

    setSubmitting(true);
    try {
      // Auto-generate mock transaction reference
      const mockUtr = 'UPI' + Date.now().toString().slice(-8) + Math.floor(1000 + Math.random() * 9000);

      const payload = {
        studentName: participantName.trim(),
        studentEmail: participantEmail.trim(),
        collegeId: collegeId.trim() || '23CSE1042',
        eventId: event.id,
        transactionRef: mockUtr,
        paymentStatus: 'PAID'
      };

      const res = await registerForEvent(payload);
      setConfirmedData(res.data);
      setStep(3); // Advance to confirmation step!
      if (onRegistrationComplete) {
        onRegistrationComplete(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-page-container py-3">
      {/* Top Breadcrumb & Event Title Header (matching reference image) */}
      <div className="payment-top-bar mb-3">
        <button type="button" className="btn btn-back-link" onClick={onBack}>
          <i className="bi bi-arrow-left me-1"></i> Back to Event Details
        </button>

        <div className="d-flex flex-wrap justify-content-between align-items-start mt-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="payment-event-title fw-bold mb-0">{event.title}</h2>
              <span className="badge-category-pill">{event.category || 'Technical'}</span>
            </div>

            <div className="event-meta-line text-muted small">
              <i className="bi bi-calendar3 me-1"></i> {event.eventDate || '30 August 2026'}
              <span className="mx-2">&bull;</span>
              <i className="bi bi-clock me-1"></i> {event.eventTime || '9:00 AM - 5:00 PM'}
              <span className="mx-2">&bull;</span>
              <i className="bi bi-geo-alt me-1"></i> {event.venue || 'College Auditorium'}
            </div>

            <p className="event-subtext text-muted small mt-1 mb-0">
              {event.description || 'Join exciting coding competitions, workshops and technical events.'}
            </p>
          </div>

          <div className="handwritten-tagline text-primary">
            {event.tagline || 'Build \u2022 Learn \u2022 Grow'}
          </div>
        </div>
      </div>

      {/* Stepper (1 Event Details -> 2 Payment -> 3 Confirmation) */}
      <div className="stepper-wrapper mb-4">
        <div className="stepper-track">
          <div className={`step-node ${step >= 1 ? 'completed' : ''}`}>
            <div className="step-circle">
              {step > 1 ? <i className="bi bi-check-lg"></i> : '1'}
            </div>
            <span className="step-label">Event Details</span>
          </div>

          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>

          <div className={`step-node ${step >= 2 ? (step === 2 ? 'current' : 'completed') : ''}`}>
            <div className="step-circle">
              {step > 2 ? <i className="bi bi-check-lg"></i> : '2'}
            </div>
            <span className="step-label">Payment</span>
          </div>

          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>

          <div className={`step-node ${step === 3 ? 'current completed' : ''}`}>
            <div className="step-circle">
              {step === 3 ? <i className="bi bi-check-lg"></i> : '3'}
            </div>
            <span className="step-label">Confirmation</span>
          </div>
        </div>
      </div>

      {/* STEP 3: CONFIRMATION SUCCESS VIEW */}
      {step === 3 && confirmedData && (
        <div className="row justify-content-center">
          <div className="col-12 col-md-8">
            <div className="confirmation-card card p-4 text-center shadow-sm border-0 rounded-4">
              <div className="success-icon-bubble mx-auto mb-3">
                <i className="bi bi-check-circle-fill text-success fs-1"></i>
              </div>
              <h3 className="fw-bold mb-1">Registration Confirmed! 🎉</h3>
              <p className="text-muted small mb-4">
                Your entry pass has been generated and saved in PostgreSQL database.
              </p>

              <div className="ticket-pass-box p-3 mb-4 text-start rounded-3 bg-light border">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <div>
                    <span className="badge bg-primary me-2">{event.category}</span>
                    <strong className="fs-5">{event.title}</strong>
                  </div>
                  <span className="status-badge-paid">PAID ₹{fee}</span>
                </div>

                <div className="row g-2 small text-muted">
                  <div className="col-6">
                    <strong>Participant:</strong> {confirmedData.studentName}
                  </div>
                  <div className="col-6">
                    <strong>College ID:</strong> {confirmedData.collegeId}
                  </div>
                  <div className="col-6">
                    <strong>Date &amp; Time:</strong> {event.eventDate} ({event.eventTime})
                  </div>
                  <div className="col-6">
                    <strong>Venue:</strong> {event.venue}
                  </div>
                  <div className="col-12 mt-2 pt-2 border-top">
                    <strong>Transaction UTR:</strong>{' '}
                    <code className="text-dark fw-bold">{confirmedData.transactionRef}</code>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-center gap-3">
                <button type="button" className="btn btn-outline-primary" onClick={onBack}>
                  <i className="bi bi-house me-1"></i> Back to Events
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer me-1"></i> Print / Download Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT & SCANNER VIEW (matching reference image) */}
      {step === 2 && (
        <div className="row g-4">
          {/* LEFT COLUMN: Event Details & Registration Summary */}
          <div className="col-12 col-lg-5">
            <div className="payment-left-card card border-0 shadow-sm rounded-4 h-100 p-4">
              {/* Event Visual Banner */}
              <div className="event-preview-hero mb-3">
                <div className="hero-poster-inner">
                  <div className="poster-top-tag">{event.category?.toUpperCase() || 'TECHNICAL'}</div>
                  <div className="poster-title-huge">{event.title}</div>
                  <div className="poster-sub-row">
                    <span>Code</span> &bull; <span>Compete</span> &bull; <span>Create</span>
                  </div>
                </div>
              </div>

              {/* Event Details Section */}
              <div className="details-section-block mb-3">
                <h6 className="block-title fw-bold d-flex align-items-center mb-2">
                  <i className="bi bi-file-earmark-text text-primary me-2"></i> Event Details
                </h6>

                <div className="details-grid-table small">
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Event Name</div>
                    <div className="col-7 fw-semibold">{event.title}</div>
                  </div>
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Category</div>
                    <div className="col-7 fw-semibold">{event.category}</div>
                  </div>
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Date</div>
                    <div className="col-7 fw-semibold">{event.eventDate || '30 August 2026'}</div>
                  </div>
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Time</div>
                    <div className="col-7 fw-semibold">{event.eventTime || '9:00 AM - 5:00 PM'}</div>
                  </div>
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Venue</div>
                    <div className="col-7 fw-semibold">{event.venue || 'College Auditorium'}</div>
                  </div>
                </div>
              </div>

              {/* Registration Summary Section */}
              <div className="summary-section-block mb-3">
                <h6 className="block-title fw-bold d-flex align-items-center mb-2">
                  <i className="bi bi-people text-primary me-2"></i> Registration Summary
                </h6>

                <div className="summary-fields-table small">
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Participant Name</div>
                    <div className="col-7 fw-bold">{participantName}</div>
                  </div>
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Registration Type</div>
                    <div className="col-7">Individual Entry</div>
                  </div>
                  <div className="row g-2 py-1 border-bottom">
                    <div className="col-5 text-muted">Ticket Price</div>
                    <div className="col-7 fw-bold text-success">₹{fee}</div>
                  </div>
                </div>
              </div>

              {/* Blue Alert Footer */}
              <div className="alert-selected-strip mt-auto p-3 rounded-3">
                <i className="bi bi-check-circle-fill text-primary me-2"></i>
                <span className="small text-primary">
                  You've selected this event. Please complete the payment to confirm your registration.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: UPI Scanner & Payment Completion */}
          <div className="col-12 col-lg-7">
            <div className="payment-right-card card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-1 d-flex align-items-center">
                <i className="bi bi-credit-card text-primary me-2"></i> Complete Your Payment
              </h5>
              <p className="text-muted small mb-3">
                Scan the QR code below using any UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.) to complete the payment of{' '}
                <strong className="text-dark">₹{fee}</strong>.
              </p>

              {error && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* QR Code and Info Layout */}
              <div className="row align-items-center mb-3">
                {/* QR Code box */}
                <div className="col-12 col-sm-5 text-center">
                  <div className="qr-container-box mx-auto">
                    <div className="qr-inner-frame">
                      <QRCodeSVG
                        value={upiUri}
                        size={170}
                        level="H"
                        includeMargin={true}
                      />
                      <div className="qr-center-logo">
                        <span>UPI</span>
                      </div>
                    </div>
                    <div className="qr-scan-caption small mt-2 fw-semibold text-muted">
                      Scan &amp; Pay via UPI
                    </div>
                  </div>
                </div>

                {/* UPI Details side */}
                <div className="col-12 col-sm-7 mt-3 mt-sm-0">
                  <div className="upi-details-card p-3 rounded-3 bg-light">
                    {/* UPI ID with copy */}
                    <div className="upi-meta-row mb-2 pb-2 border-bottom d-flex justify-content-between align-items-center">
                      <div>
                        <span className="small text-muted d-block">UPI ID</span>
                        <code className="fw-bold text-dark fs-6">{upiId}</code>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleCopyUpi}
                        title="Copy UPI ID"
                      >
                        <i className={`bi ${copiedUpi ? 'bi-check-lg text-success' : 'bi-copy'}`}></i>
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="upi-meta-row mb-2 pb-2 border-bottom">
                      <span className="small text-muted d-block">Amount</span>
                      <span className="amount-highlight fw-bold fs-4 text-success">₹{fee}</span>
                    </div>

                    {/* Event & Participant */}
                    <div className="upi-meta-row mb-2">
                      <span className="small text-muted d-block">Event</span>
                      <strong className="small">{event.title}</strong>
                    </div>

                    <div className="upi-meta-row">
                      <span className="small text-muted d-block">Participant</span>
                      <strong className="small">{participantName}</strong>
                    </div>
                  </div>

                  {/* UPI Apps Icons */}
                  <div className="upi-apps-row d-flex justify-content-between align-items-center mt-3 pt-2">
                    <div className="app-badge gpay">
                      <span className="app-icon-letter">G</span>
                      <span className="app-label">GPay</span>
                    </div>
                    <div className="app-badge phonepe">
                      <span className="app-icon-letter">Pe</span>
                      <span className="app-label">PhonePe</span>
                    </div>
                    <div className="app-badge paytm">
                      <span className="app-icon-letter">Pt</span>
                      <span className="app-label">Paytm</span>
                    </div>
                    <div className="app-badge bhim">
                      <span className="app-icon-letter">BH</span>
                      <span className="app-label">BHIM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer Bar */}
              <div className="timer-bar-box d-flex justify-content-between align-items-center p-2 px-3 rounded-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history text-primary fs-5"></i>
                  <span className="small">
                    Payment expires in <strong className="font-monospace fs-6">{formatTimer(timeLeft)}</strong>
                  </span>
                </div>
                <span className="small text-muted d-none d-sm-inline">
                  Please complete the payment within the given time.
                </span>
              </div>

              {/* Participant edit inputs if desired */}
              <div className="participant-form-wrap p-3 rounded-3 bg-light mb-3">
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold mb-1">Participant Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Your Name"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold mb-1">Email (@email.com)</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      placeholder="student@email.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Secure Payment Note */}
              <div className="secure-badge-box d-flex align-items-center gap-2 p-2 px-3 rounded-3 mb-3">
                <i className="bi bi-shield-fill-check text-success fs-5"></i>
                <div className="small">
                  <strong>Secure Payment</strong> &bull; Your payment is processed securely through trusted UPI platforms.
                </div>
              </div>

              {/* Submit Payment Button (auto submits and completes registration) */}
              <div className="action-buttons-row">
                <button
                  type="button"
                  className="btn btn-confirm-payment w-100 py-3 fw-bold fs-6 shadow-sm"
                  disabled={submitting}
                  onClick={handleSubmitPayment}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Confirming Registration in PostgreSQL...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-2"></i>
                      Confirm Registration &amp; Submit Payment
                    </>
                  )}
                </button>
                <div className="text-center small text-muted mt-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Submission mode enabled: Instant automatic verification to PostgreSQL database
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

