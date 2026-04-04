"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const city = String(formData.get("city") ?? "").trim();

    if (!name || !email || !password) {
      setStatus("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    const result = await register(email, password, name, city);
    if (result.success) {
      setStatus("Account created successfully! Redirecting to shop...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      setStatus(result.error || "Failed to create account. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="kicker">Join shoe-otah</p>
        <h1>Create Account</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Full Name *</label>
          <input id="name" name="name" type="text" placeholder="Your full name" required />

          <label htmlFor="reg-email">Email *</label>
          <input id="reg-email" name="email" type="email" placeholder="you@example.com" required />

          <label htmlFor="reg-password">Password *</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            placeholder="At least 6 characters"
            minLength={6}
            required
          />

          <label htmlFor="reg-city">City (Optional)</label>
          <input id="reg-city" name="city" type="text" placeholder="Your city" />

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create User Account"}
          </button>

          {status ? <p className="form-status">{status}</p> : null}
        </form>
        <p className="auth-footnote">
          Already registered? <Link href="/login">Go to login.</Link>
        </p>
        <p className="auth-footnote" style={{ fontSize: "0.85rem", color: "#999", marginTop: "1rem" }}>
          ℹ️ You must create an account before you can login.
        </p>
      </div>
    </section>
  );
}
