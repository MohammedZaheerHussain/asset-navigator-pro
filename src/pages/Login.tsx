import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import "./Login.css";

/**
 * SNHRC Material Management System — Login Page
 * Restricted access: no third-party logins.
 * Split-screen layout inspired by the reference design.
 */

const DEMO_CREDENTIALS = {
  email: "admin@snhrc.org",
  password: "Snhrc@2025",
};

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    if (
      email === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      localStorage.setItem("snhrc_auth", JSON.stringify({ email, rememberMe }));
      navigate("/");
    } else {
      setError("Invalid credentials. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="login-page">
      {/* ─── Left: Hero Image ─── */}
      <div className="login-hero">
        <img
          src="/hospital-bg.png"
          alt="SNHRC Hospital"
          className="login-hero-img"
        />
        <div className="login-hero-overlay" />

        {/* Logo + tagline */}
        <div className="login-hero-content">
          <div className="login-hero-logo">
            <img
              src="/snhrc-logo.jpg"
              alt="SNHRC"
              className="login-hero-logo-img"
            />
            <span className="login-hero-logo-text">SNHRC</span>
          </div>

          <div className="login-hero-tagline">
            <h2>Material Management System</h2>
            <p>
              Streamlined asset tracking &amp; management
              <br />
              across all SNHRC branches
            </p>
          </div>

          {/* Dot indicators (decorative) */}
          <div className="login-hero-dots">
            <span className="dot active" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </div>

      {/* ─── Right: Login Form ─── */}
      <div className="login-form-wrapper">
        {/* Top-right badge */}
        <div className="login-badge">
          <Shield size={14} />
          <span>Secure Access</span>
        </div>

        <form className="login-form" onSubmit={handleLogin} autoComplete="on">
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">
            Sign in to your SNHRC account
          </p>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="login-field">
            <label htmlFor="login-email">Your Email</label>
            <div className="login-input-wrap">
              <Mail size={16} className="login-input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="name@snhrc.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="login-meta">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              className="login-forgot"
              onClick={() => setShowForgot(!showForgot)}
            >
              Forgot Password?
            </button>
          </div>

          {showForgot && (
            <div className="login-forgot-msg">
              Contact your system administrator to reset your credentials.
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login-spinner" />
            ) : (
              "Login"
            )}
          </button>

          {/* Restricted notice */}
          <div className="login-restricted">
            <Shield size={14} />
            <span>
              This system is restricted to authorized SNHRC personnel only.
              <br />
              Unauthorized access is prohibited.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
