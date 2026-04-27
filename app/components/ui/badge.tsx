"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
  className?: string;
}

const variantStyles = {
  default: "bg-[#f0f0f0] text-[#666]",
  primary: "bg-[var(--accent)] text-white",
  success: "bg-[#4caf50] text-white",
  warning: "bg-[#ff9800] text-white",
  danger: "bg-[#f44336] text-white",
  info: "bg-[#2196f3] text-white",
  outline: "bg-transparent border border-[var(--line)] text-[#5e584d]",
};

const sizeStyles = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

