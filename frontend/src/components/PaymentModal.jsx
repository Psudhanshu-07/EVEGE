import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const FEE = 100;

export default function PaymentModal({ show, event, student, onClose, onConfirmed }) {
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setUtr('');
      setError('');
      setSubmitting(false);
    }
  }, [show, event]);

  if (!show || !event) return null;

  const upiId = event.upiId || 'evege@upi';
  // Dynamic UPI intent string scanned by any UPI app.
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    'College Event Manager'
  )}&am=${FEE}.00&cu=INR&tn=${encodeURIComponent(event.title)}`;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!utr.trim()) {
      setError('Please enter the UPI Transaction Reference / UTR number.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onConfirmed({
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        collegeId: student.collegeId,
        eventId: event.id,
        transactionRef: utr.trim(),
        paymentStatus: 'PAID'
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment could not be recorded. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="evege-modal-backdrop" onClick={onClose}>
      <div className="evege-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <span>
            <i className="bi bi-upc-scan me-2 text-warning"></i>
            Pay Registration Fee
          </span>
          <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
        </div>

        <div className="modal-bd text-center">
          <h6 className="fw-bold mb-1">{event.title}</h6>
          <p className="text-muted small mb-3">
            Payable Amount: <span className="text-success fw-bold fs-5">₹100.00</span>
          </p>

          <div className="qr-frame">
            <QRCodeSVG value={upiUri} size={180} level="M" />
          </div>

          <p className="small text-muted mt-3 mb-2">
            Scan this QR code using any UPI app (Google Pay, PhonePe, Paytm, BHIM) to transfer{' '}
            <strong>₹100.00</strong> to <code>{upiId}</code>.
          </p>

          <div className="upi-apps">
            <span className="upi-app"><span style={{ background: '#1a73e8' }}>GPay</span>Google Pay</span>
            <span className="upi-app"><span style={{ background: '#5f259f' }}>Ph</span>PhonePe</span>
            <span className="upi-app"><span style={{ background: '#00baf2' }}>Pt</span>Paytm</span>
            <span className="upi-app"><span style={{ background: '#ed7316' }}>BH</span>BHIM</span>
          </div>

          <form onSubmit={handleConfirm} className="text-start mt-3">
            <div className="mb-2">
              <span className="form-label-sm">UPI Transaction Reference / UTR No.</span>
              <div className="input-wrap">
                <i className="bi bi-receipt"></i>
                <input
                  className="evege-input"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. 324109823412"
                />
              </div>
            </div>

            {error && <div className="alert-evege mb-2">{error}</div>}

            <div className="secure-line mb-3">
              <i className="bi bi-shield-lock text-success"></i>
              <span>
                <strong>Secure Payment</strong><br />
                Your payment is processed securely through trusted UPI platforms.
              </span>
            </div>

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-evege" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-pay fw-bold flex-grow-1" disabled={submitting}>
                {submitting ? 'Recording payment…' : 'Confirm & Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
