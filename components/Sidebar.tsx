"use client";

import React from "react";

interface NavItem {
  key: string;
  label: string;
  icon: string;
}

const mainNav: NavItem[] = [
  { key: "overview", label: "Dashboard", icon: "⬡" },
];

const manageNav: NavItem[] = [
  { key: "sales", label: "Sales & Leads", icon: "◎" },
  { key: "retention", label: "Retention", icon: "◈" },
  { key: "va", label: "VA Performance", icon: "◉" },
];

const analyzeNav: NavItem[] = [
  { key: "financial", label: "Financial", icon: "◆" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
  onSignOut: () => void;
}

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-brand/10 text-brand"
          : "text-neutral-500 hover:bg-white/[0.04] hover:text-neutral-300"
      }`}
    >
      <span className={`text-base ${isActive ? "text-brand" : "text-neutral-600"}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  );
}

function NavSection({
  label,
  items,
  activeTab,
  onTabChange,
}: {
  label: string;
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 mb-2 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
        {label}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.key}
          item={item}
          isActive={activeTab === item.key}
          onClick={() => onTabChange(item.key)}
        />
      ))}
    </div>
  );
}

export default function Sidebar({
  activeTab,
  onTabChange,
  userEmail,
  onSignOut,
}: SidebarProps) {
  const initials = userEmail
    ? userEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "BL";

  return (
    <div className="flex h-screen w-60 flex-col bg-[#0a0a0a] border-r border-white/10 shrink-0">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-white/10">
        <button
          onClick={() => onTabChange("overview")}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-black text-xs font-bold">BL</span>
          </div>
          <span className="text-sm font-semibold text-white group-hover:text-brand transition-colors">
            BadgerLuxClean
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.key}
              item={item}
              isActive={activeTab === item.key}
              onClick={() => onTabChange(item.key)}
            />
          ))}
        </div>

        <NavSection label="Manage" items={manageNav} activeTab={activeTab} onTabChange={onTabChange} />
        <NavSection label="Analyze" items={analyzeNav} activeTab={activeTab} onTabChange={onTabChange} />
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-amber-600 text-black text-xs font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-400 truncate">{userEmail}</p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-red-400 text-xs"
          >
            ✕
          </button>
        </div>
        <p className="text-[10px] text-neutral-700 mt-2 px-2">
          Powered by{" "}
          <span className="text-brand/50 font-medium">DivineAcquisition</span>
        </p>
      </div>
    </div>
  );
}
