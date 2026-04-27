"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-6 bg-[#f9f9f9] rounded-xl ${className}`}>
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-base text-[#666] font-medium mb-2 m-0">{title}</p>
      {description && (
        <p className="text-sm text-[#999] mb-4 m-0">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

