"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "stats" | "hoverable" | "form" | "outline";
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

const variantStyles = {
  default: "bg-[var(--surface)] border border-[var(--line)] rounded-xl",
  stats: "bg-[var(--surface)] border border-[var(--line)] rounded-xl transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[0_2px_8px_rgba(239,91,42,0.1)]",
  hoverable: "bg-[var(--surface)] border-2 border-[var(--line)] rounded-xl cursor-pointer transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_4px_12px_rgba(33,150,243,0.15)] hover:-translate-y-0.5",
  form: "bg-[var(--surface)] border border-[var(--line)] rounded-xl",
  outline: "bg-transparent border-2 border-dashed border-[var(--line)] rounded-xl hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all duration-200",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  variant = "default",
  className = "",
  padding = "md",
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

