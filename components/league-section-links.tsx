"use client";
import { useEffect, useState } from "react";
type Section = { id: string; label: string; view: "dashboard" | "rankings" };
export function LeagueSectionLinks({ sections, onViewChange }: { sections: Section[]; onViewChange: (view: "dashboard" | "rankings") => void }) {
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    const followHash = () => {
      const section = sections.find(s => `#${s.id}` === window.location.hash);
      if (section) { onViewChange(section.view); setTarget(section.id); }
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, [sections, onViewChange]);
  useEffect(() => {
    if (!target) return;
    const scroll = () => {
      const element = document.getElementById(target);
      if (!element) return false;
      element.scrollIntoView({ block: "start" });
      element.tabIndex = -1;
      element.focus({ preventScroll: true });
      return true;
    };
    if (scroll()) return;
    // Dashboard sections may arrive after the stored snapshot finishes loading.
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [target]);
  return <p className="hero-copy league-intro">Explore {sections.map((section, index) => <span key={section.id}>
    {index ? index === sections.length - 1 ? ", and " : ", " : ""}
    <a href={`#${section.id}`} onClick={event => {
      event.preventDefault();
      onViewChange(section.view);
      window.history.pushState(null, "", `#${section.id}`);
      setTarget(null);
      // Repeated clicks must also jump back to the same section.
      requestAnimationFrame(() => setTarget(section.id));
    }}>{section.label}</a>
  </span>)}—all from the latest snapshot.</p>;
}
