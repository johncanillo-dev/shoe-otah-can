"use client";

import { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`border-b-2 border-[var(--line)] mb-8 ${className}`}>
      <div className="flex gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mb-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-200
              border-b-[3px] bg-transparent cursor-pointer
              ${activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)] font-semibold"
                : "border-transparent text-[#5e584d] hover:text-[var(--ink)]"
              }
            `}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <span className="text-base">{tab.icon}</span>}
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--accent)] rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TabPanelProps {
  children: ReactNode;
  isActive: boolean;
}

export function TabPanel({ children, isActive }: TabPanelProps) {
  if (!isActive) return null;
  return <div className="animate-[fadeIn_0.2s_ease-out]">{children}</div>;
}

