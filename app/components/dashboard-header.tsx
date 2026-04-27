"use client";

import { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  email?: string;
  badge?: string;
  settingsIcon?: ReactNode;
}

export const DashboardHeader = ({ title, subtitle, email, badge, settingsIcon }: DashboardHeaderProps) => {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1.5rem 0",
      borderBottom: "1px solid #e0d5cc",
      marginBottom: "2rem",
    }}>
      {/* Left Side - Title & Info */}
      <div>
        <p style={{
          fontSize: "0.85rem",
          fontWeight: "600",
          color: "#ff9800",
          margin: "0 0 0.5rem 0",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          {subtitle}
        </p>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          color: "#2c2c2c",
          margin: "0 0 0.5rem 0",
        }}>
          {title}
        </h1>
        {email && (
          <p style={{
            fontSize: "0.9rem",
            color: "#666",
            margin: "0",
          }}>
            {email}
          </p>
        )}
      </div>

      {/* Right Side - Settings Icon & Badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}>
        {/* Settings Icon */}
        {settingsIcon && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {settingsIcon}
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--accent)",
            color: "#fff",
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
