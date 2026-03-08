"use client";

import React from "react";

const navItems = [
  { key: "overview", label: "Command Center", icon: "◆" },
  { key: "sales", label: "Sales & Leads", icon: "◎" },
  { key: "retention", label: "Retention", icon: "◈" },
  { key: "va", label: "VA Performance", icon: "◉" },
  { key: "financial", label: "Financial", icon: "⬡" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onSignOut: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  userEmail,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-black border-r border-neutral-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-neutral-800">
        <h1 className="text-lg font-bold text-brand tracking-tight">
          BADGERLUXCLEAN
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Data Command Center</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-neutral-500 hover:text-brand hover:bg-neutral-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
        <button
          onClick={onSignOut}
          className="text-xs text-neutral-500 hover:text-brand mt-2 transition-colors"
        >
          Sign Out
        </button>
        <p className="text-[10px] text-neutral-600 mt-3">
          Powered by{" "}
          <span className="text-brand/70 font-medium">DivineAcquisition</span>
        </p>
      </div>
    </aside>
  );
}
