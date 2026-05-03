"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, adminLogin } = useAuth();
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const ADMIN_EMAIL = "admin@shoe-otah.com";

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setStatus("Please enter both email and password.");
      setIsSubmitting(false);
      return;
    }

    const isAdminLogin = email.toLowerCase() === ADMIN_EMAIL;
    const result = isAdminLogin ? await adminLogin(email, password) : await login(email, password);

    if (result.success) {
      setStatus(isAdminLogin ? "Admin login successful. Redirecting to admin panel..." : "Login successful. Redirecting to shop...");
      setTimeout(() => {
        router.push(isAdminLogin ? "/admin" : "/");
      }, isAdminLogin ? 500 : 1000);
    } else {
      setStatus(result.error || (isAdminLogin ? "Admin login failed. Please try again." : "Login failed. Please check your credentials."));
      setIsSubmitting(false);
    }
  }



  return (
    <section className="auth-shell-pro">
      <div className="auth-container-pro">
        {/* Left Side - Form */}
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <img
                  src="/shoe-otah-logo.png"
                  alt="SHOE-OTAH Logo"
                  style={{ width: "40px", height: "40px" }}
                />
                <h2 className="auth-title">Welcome Back</h2>
              </div>
              <p className="auth-subtitle">Sign in to your account</p>
            </div>

            <form className="auth-form-pro" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com or admin@shoe-otah.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Password
                </label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-pro btn-primary-pro" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10 17 15 12 10 7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {status && (
                <div className={`form-status-pro ${status.includes("successful") ? "success" : "error"}`}>
                  {status}
                </div>
              )}

              <div className="auth-divider">
                <span>New to SHOE-OTAH?</span>
              </div>

              <Link href="/register" className="btn-pro btn-secondary-pro">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <span>Create Account</span>
              </Link>
            </form>
          </div>
        </div>

        {/* Right Side - Brand */}
        <div className="auth-brand-side">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <img
                src="/shoe-otah-logo.png"
                alt="SHOE-OTAH Logo"
                style={{ maxWidth: "120px", height: "auto" }}
              />
              <h2 className="auth-logo-text">SHOE-OTAH</h2>
            </div>
            <h1 className="auth-brand-title">Your Trusted Online Marketplace "by John Canillo"</h1>
            <p className="auth-brand-subtitle">
              Discover premium products from shoe-otah. Join thousands of happy customers shopping with confidence.
              available products: shoes, shirts, pants, socks, jewerly, beuty products.
             </p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <div className="feature-icon">✓</div>
                <span>Verified Sellers</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-icon">✓</div>
                <span>Secure Payments</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-icon">✓</div>
                <span>Fast Delivery</span>
              </div>
            </div>

            {/* Facebook Link */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <a
                href="https://www.facebook.com/Chyxzykiss/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#1877F2",
                  color: "white",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "background-color 0.3s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#165FD8"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1877F2"}
              >
                <span>📱</span>
                Follow us on Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
