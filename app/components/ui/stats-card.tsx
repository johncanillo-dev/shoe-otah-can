"use client";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: "default" | "orange" | "blue" | "purple" | "green" | "red";
  className?: string;
}

const colorMap = {
  default: { text: "text-[#2c2420]", bg: "bg-[#f5f1ed]" },
  orange: { text: "text-[#ff9800]", bg: "bg-[#fff3e0]" },
  blue: { text: "text-[#2196f3]", bg: "bg-[#e3f2fd]" },
  purple: { text: "text-[#673ab7]", bg: "bg-[#ede7f6]" },
  green: { text: "text-[#4caf50]", bg: "bg-[#e8f5e9]" },
  red: { text: "text-[#f44336]", bg: "bg-[#ffebee]" },
};

export function StatsCard({
  label,
  value,
  icon,
  color = "default",
  className = "",
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`
        bg-white rounded-xl p-5 border border-[var(--line)]
        transition-all duration-200
        hover:border-[var(--accent)] hover:shadow-[0_2px_8px_rgba(239,91,42,0.1)]
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-[#5e584d] uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${colors.bg} ${colors.text} text-sm`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${colors.text}`}>
        {value}
      </p>
    </div>
  );
}

