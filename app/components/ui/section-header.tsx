"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  badge,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-[var(--line)] ${className}`}>
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)] m-0">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[#5e584d] mt-1 m-0">{subtitle}</p>
          )}
        </div>
        {badge && <div>{badge}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

