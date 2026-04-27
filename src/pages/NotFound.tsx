import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Shield } from "lucide-react";
import "./NotFound.css";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="notfound-page">
      {/* Decorative background */}
      <div className="notfound-bg-shapes">
        <div className="notfound-shape shape-1" />
        <div className="notfound-shape shape-2" />
        <div className="notfound-shape shape-3" />
      </div>

      <div className="notfound-card">
        {/* Logo */}
        <div className="notfound-logo">
          <img src="/snhrc-logo.jpg" alt="SNHRC" />
        </div>

        {/* 404 Number */}
        <h1 className="notfound-code">404</h1>

        <h2 className="notfound-title">Page Not Found</h2>

        <p className="notfound-desc">
          The page <code>{location.pathname}</code> doesn't exist
          or you don't have permission to access it.
        </p>

        {/* Actions */}
        <div className="notfound-actions">
          <button className="notfound-btn primary" onClick={() => navigate("/")}>
            <Home size={16} />
            Go to Dashboard
          </button>
          <button className="notfound-btn secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Footer */}
        <div className="notfound-footer">
          <Shield size={12} />
          <span>SNHRC Material Management System</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
