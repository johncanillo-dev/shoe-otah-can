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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6 border-b border-[var(--line)] mb-8">
      <div>
        <p className="text-xs font-semibold text-[#ff9800] mb-2 m-0 uppercase tracking-wider">
          {subtitle}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c2c2c] mb-2 m-0">
          {title}
        </h1>
        {email && (
          <p className="text-sm text-[#666] m-0">
            {email}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {settingsIcon && (
          <div className="flex items-center justify-center">
            {settingsIcon}
          </div>
        )}

        {badge && (
          <span className="inline-block px-4 py-2 bg-[var(--accent)] text-white rounded-full text-sm font-semibold whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

