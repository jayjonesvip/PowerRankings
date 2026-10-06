"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

export function HeaderNavigation({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  return <>
    <div className="header-desktop-navigation">{children}</div>
    <details className="header-mobile-menu" ref={menu} onKeyDown={event => {
      if (event.key === "Escape" && menu.current?.open) {
        event.preventDefault(); menu.current.open = false; menu.current.querySelector("summary")?.focus();
      }
    }}>
      <summary aria-label="League navigation menu"><Menu className="menu-open-icon" aria-hidden="true" /><X className="menu-close-icon" aria-hidden="true" /></summary>
      <div className="header-mobile-panel" onClick={event => {
        if ((event.target as Element).closest("a") && menu.current) menu.current.open = false;
      }}>{children}</div>
    </details>
  </>;
}
