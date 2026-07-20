"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LineChart, Cpu, MapPin } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Explorador de Mercado", icon: MapPin },
    { href: "/optimizer", label: "Optimizador de Propiedad", icon: LineChart },
    { href: "/etl", label: "Pipeline de Datos", icon: Cpu }
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <BarChart3 className="logo-icon" />
        <span>Revenue Manager</span>
      </div>
      
      <nav className="nav-links">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "block" }}>
          Ubicación Objetivo:
        </span>
        <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.9rem", display: "block" }}>
          Palermo Hollywood
        </span>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>
          Buenos Aires, ARG
        </span>
      </div>
    </aside>
  );
}
