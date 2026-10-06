import React, { useState } from 'react';
import { login, registerUser } from '../services/apiService';

export default function AuthModal({ show, initialMode = 'student-register', onClose, onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'student-register', 'student-login', 'admin-login'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    branch: '',
    rollNumber: '',
    yearSemester: '',
    gender: '',
    password: '',
    confirmPassword: '',
    agreed: false
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [adminForm, setAdminForm] = useState({
    email: 'demoadmin@gmail.com',
    password: '123321'
  });

  const [showPass, setShowPass] = useState(false);

  if (!show) return null;

  const handleRegChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = regForm.email.trim();
    if (!email.toLowerCase().endsWith('@email.com')) {
      setError('Email address must end with @email.com (e.g., student@email.com)');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!regForm.agreed) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        fullName: regForm.fullName,
        email: email,
        phone: regForm.phone,
        college: regForm.college,
        branch: regForm.branch,
        rollNumber: regForm.rollNumber,
        yearSemester: regForm.yearSemester,
        gender: regForm.gender,
        password: regForm.password,
        role: 'STUDENT'
      });

      const { token, role, fullName } = res.data;
      localStorage.setItem('evege_token', token);
      const userObj = { email, fullName, role: role || 'STUDENT' };
      localStorage.setItem('evege_user', JSON.stringify(userObj));
      onLoginSuccess(userObj, 'student');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = loginForm.email.trim();
    if (!email.toLowerCase().endsWith('@email.com')) {
      setError('Student email must end with @email.com (e.g. student@email.com)');
      return;
    }

    setLoading(true);
    try {
      const res = await login({
        email: email,
        password: loginForm.password
      });

      const { token, role, fullName } = res.data;
      localStorage.setItem('evege_token', token);
      const userObj = { email, fullName, role: role || 'STUDENT' };
      localStorage.setItem('evege_user', JSON.stringify(userObj));
      onLoginSuccess(userObj, 'student');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const res = await login({
        email: adminForm.email.trim(),
        password: adminForm.password
      });

      const { token, role, fullName } = res.data;
      localStorage.setItem('evege_token', token);
      const userObj = { email: adminForm.email, fullName: fullName || 'Administrator', role: role || 'ADMIN' };
      localStorage.setItem('evege_user', JSON.stringify(userObj));
      // Notify parent to redirect directly to admin panel!
      onLoginSuccess(userObj, 'admin');
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evege-modal-overlay" onClick={onClose}>
      <div className="auth-card-shell" onClick={(e) => e.stopPropagation()}>
        {/* Top switcher tabs */}
        <div className="auth-tabs d-flex justify-content-between align-items-center">
          <div className="d-flex gap-1">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'student-register' ? 'active' : ''}`}
              onClick={() => { setMode('student-register'); setError(''); }}
            >
              Student Register
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'student-login' ? 'active' : ''}`}
              onClick={() => { setMode('student-login'); setError(''); }}
            >
              Student Login
            </button>
            <button
              type="button"
              className={`auth-tab-btn admin-tab ${mode === 'admin-login' ? 'active' : ''}`}
              onClick={() => { setMode('admin-login'); setError(''); }}
            >
              <i className="bi bi-shield-lock-fill me-1"></i> Admin Login
            </button>
          </div>
          <button type="button" className="btn-close-auth" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {error && (
          <div className="auth-alert mb-3">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            <span>{error}</span>
          </div>
        )}

        {/* ---------------- MODE: STUDENT REGISTER ---------------- */}
        {mode === 'student-register' && (
          <div className="auth-body">
            <div className="text-center mb-3">
              <div className="brand-logo-inline">
                <i className="bi bi-calendar2-star text-primary fs-3"></i>
                <span className="brand-text-sm ms-2">EVEGE</span>
              </div>
              <h4 className="fw-bold mt-2 mb-1">Create Your Account</h4>
              <p className="text-muted small">Join EVEGE and be a part of exciting college events.</p>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="auth-label">Full Name *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-person"></i>
                    <input
                      name="fullName"
                      value={regForm.fullName}
                      onChange={handleRegChange}
                      placeholder="e.g. Sudanshu Pandey"
                      required
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="auth-label">Email Address (@email.com) *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-envelope"></i>
                    <input
                      name="email"
                      type="email"
                      value={regForm.email}
                      onChange={handleRegChange}
                      placeholder="name@email.com"
                      required
                    />
                  </div>
                  <div className="field-hint">Must end with @email.com</div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="auth-label">Phone Number *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-telephone"></i>
                    <input
                      name="phone"
                      value={regForm.phone}
                      onChange={handleRegChange}
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="auth-label">College / University *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-mortarboard"></i>
                    <input
                      name="college"
                      value={regForm.college}
                      onChange={handleRegChange}
                      placeholder="e.g. Delhi Technological University"
                      required
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="auth-label">Branch *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-building"></i>
                    <select
                      name="branch"
                      value={regForm.branch}
                      onChange={handleRegChange}
                      required
                    >
                      <option value="">Select Branch</option>
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="auth-label">Roll Number *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-hash"></i>
                    <input
                      name="rollNumber"
                      value={regForm.rollNumber}
                      onChange={handleRegChange}
                      placeholder="e.g. 23CSE1042"
                      required
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="auth-label">Year / Semester *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-calendar3"></i>
                    <select
                      name="yearSemester"
                      value={regForm.yearSemester}
                      onChange={handleRegChange}
                      required
                    >
                      <option value="">Select Year / Semester</option>
                      <option value="1st Year (Semester 1 / 2)">1st Year (Semester 1 / 2)</option>
                      <option value="2nd Year (Semester 3 / 4)">2nd Year (Semester 3 / 4)</option>
                      <option value="3rd Year (Semester 5 / 6)">3rd Year (Semester 5 / 6)</option>
                      <option value="4th Year (Semester 7 / 8)">4th Year (Semester 7 / 8)</option>
                    </select>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="auth-label">Password *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-lock"></i>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={regForm.password}
                      onChange={handleRegChange}
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      className="btn-pass-toggle"
                      onClick={() => setShowPass(!showPass)}
                    >
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="auth-label">Confirm Password *</label>
                  <div className="auth-input-group">
                    <i className="bi bi-lock-fill"></i>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="confirmPassword"
                      value={regForm.confirmPassword}
                      onChange={handleRegChange}
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="auth-label">Gender (Optional)</label>
                  <div className="gender-options d-flex gap-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <label
                        key={g}
                        className={`gender-chip ${regForm.gender === g ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={regForm.gender === g}
                          onChange={handleRegChange}
                          className="d-none"
                        />
                        <i className={`bi bi-${g === 'Male' ? 'gender-male' : g === 'Female' ? 'gender-female' : 'person'} me-1`}></i>
                        {g}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-12 mt-2">
                  <div className="form-check small">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="agreed"
                      id="agreeCheck"
                      checked={regForm.agreed}
                      onChange={handleRegChange}
                    />
                    <label className="form-check-label text-muted" htmlFor="agreeCheck">
                      I agree to the <span className="text-primary fw-medium">Terms &amp; Conditions</span> and{' '}
                      <span className="text-primary fw-medium">Privacy Policy</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-auth-primary w-100 mt-3"
                disabled={loading}
              >
                {loading ? 'Creating Account…' : <>Register &rarr;</>}
              </button>

              <div className="text-center my-2 text-muted small">OR</div>

              <button
                type="button"
                className="btn btn-outline-google w-100"
                onClick={() => {
                  setRegForm({
                    fullName: 'Sudanshu Pandey',
                    email: 'sudanshu@email.com',
                    phone: '9876543211',
                    college: 'Delhi Technological University',
                    branch: 'Computer Science & Engineering',
                    rollNumber: '23CSE1042',
                    yearSemester: '3rd Year (Semester 5 / 6)',
                    gender: 'Male',
                    password: 'password123',
                    confirmPassword: 'password123',
                    agreed: true
                  });
                }}
              >
                <i className="bi bi-magic me-2 text-primary"></i> Fill Demo Student Details
              </button>

              <div className="text-center mt-3 small text-muted">
                Already have an account?{' '}
                <span
                  className="text-primary fw-bold cursor-pointer"
                  onClick={() => { setMode('student-login'); setError(''); }}
                >
                  Login
                </span>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- MODE: STUDENT LOGIN ---------------- */}
        {mode === 'student-login' && (
          <div className="auth-body py-2">
            <div className="text-center mb-4">
              <div className="brand-logo-inline">
                <i className="bi bi-mortarboard-fill text-primary fs-3"></i>
                <span className="brand-text-sm ms-2">EVEGE STUDENT</span>
              </div>
              <h4 className="fw-bold mt-2 mb-1">Student Login</h4>
              <p className="text-muted small">Access your registered events, passes, and campus activities.</p>
            </div>

            <form onSubmit={handleStudentLoginSubmit}>
              <div className="mb-3">
                <label className="auth-label">Student Email (@email.com) *</label>
                <div className="auth-input-group">
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="student@email.com"
                    required
                  />
                </div>
                <div className="field-hint">Must end with @email.com</div>
              </div>

              <div className="mb-3">
                <label className="auth-label">Password *</label>
                <div className="auth-input-group">
                  <i className="bi bi-lock"></i>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="btn-pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-auth-primary w-100 mt-2"
                disabled={loading}
              >
                {loading ? 'Logging in…' : 'Sign In as Student'}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary w-100 mt-2 btn-sm"
                onClick={() => setLoginForm({ email: 'student@email.com', password: '123321' })}
              >
                <i className="bi bi-key me-1"></i> Quick Fill Seeded Student (student@email.com / 123321)
              </button>

              <div className="text-center mt-3 small text-muted">
                Don't have an account yet?{' '}
                <span
                  className="text-primary fw-bold cursor-pointer"
                  onClick={() => { setMode('student-register'); setError(''); }}
                >
                  Create Your Account
                </span>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- MODE: ADMIN LOGIN ---------------- */}
        {mode === 'admin-login' && (
          <div className="auth-body py-2">
            <div className="text-center mb-4">
              <div className="admin-icon-circle mx-auto mb-2">
                <i className="bi bi-shield-lock-fill text-warning fs-3"></i>
              </div>
              <h4 className="fw-bold mb-1">Administrator Portal</h4>
              <p className="text-muted small">
                Sign in to manage college events, view database records, and control event registrations.
              </p>
            </div>

            <div className="admin-credentials-badge mb-3">
              <i className="bi bi-info-circle-fill me-2 text-warning"></i>
              <div>
                <strong>Admin Credentials Configured:</strong>
                <div className="small font-monospace">demoadmin@gmail.com / 123321</div>
              </div>
            </div>

            <form onSubmit={handleAdminLoginSubmit}>
              <div className="mb-3">
                <label className="auth-label">Admin Email *</label>
                <div className="auth-input-group">
                  <i className="bi bi-envelope-at-fill"></i>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="demoadmin@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="auth-label">Password *</label>
                <div className="auth-input-group">
                  <i className="bi bi-lock-fill"></i>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="123321"
                    required
                  />
                  <button
                    type="button"
                    className="btn-pass-toggle"
                    onClick={() => setShowPass(!showPass)}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-warning w-100 fw-bold py-2 shadow-sm"
                disabled={loading}
              >
                {loading ? 'Authenticating Admin…' : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-1"></i> Login &amp; Redirect to Admin Panel &rarr;
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

