import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useLoginMutation, setAuth } from "@/store/apiSlice";
import "./Login.css";

/**
 * SNHRC Material Management System — Login Page
 * Uses RTK Query mutation for JWT authentication.
 */

const Login = () => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email/username and password.");
      return;
    }

    try {
      const result = await login({
        username: email.includes("@") ? email.split("@")[0] : email,
        password,
      }).unwrap();

      if (result.success && result.data) {
        setAuth(result.data.token, result.data.user);
        navigate("/");
      } else {
        setError(result.message || "Invalid credentials.");
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Unable to connect to server.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <img src="/hospital-bg.png" alt="SNHRC Hospital" className="login-hero-img" />
        <div className="login-hero-overlay" />
        <div className="login-hero-content">
          <div className="login-hero-logo">
            <img src="/snhrc-logo.jpg" alt="SNHRC" className="login-hero-logo-img" />
            <span className="login-hero-logo-text">SNHRC</span>
          </div>
          <div className="login-hero-tagline">
            <h2>Material Management System</h2>
            <p>Streamlined asset tracking &amp; management<br />across all SNHRC branches</p>
          </div>
          <div className="login-hero-dots">
            <span className="dot active" /><span className="dot" /><span className="dot" />
          </div>
        </div>
      </div>

      <div className="login-form-wrapper">
        <div className="login-badge"><Shield size={14} /><span>Secure Access</span></div>
        <form className="login-form" onSubmit={handleLogin} autoComplete="on">
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtitle">Sign in to your SNHRC account</p>

          {error && <div className="login-error" role="alert">{error}</div>}

          <div className="login-field">
            <label htmlFor="login-email">Email or Username</label>
            <div className="login-input-wrap">
              <Mail size={16} className="login-input-icon" />
              <input id="login-email" type="text" placeholder="admin or admin@snhrc.org" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" className="login-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="login-meta">
            <label className="login-remember">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /><span>Remember Me</span>
            </label>
            <button type="button" className="login-forgot" onClick={() => setShowForgot(!showForgot)}>Forgot Password?</button>
          </div>

          {showForgot && <div className="login-forgot-msg">Contact your system administrator to reset your credentials.</div>}

          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? <span className="login-spinner" /> : "Login"}
          </button>

          <div className="login-restricted">
            <Shield size={14} />
            <span>This system is restricted to authorized SNHRC personnel only.<br />Unauthorized access is prohibited.</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
