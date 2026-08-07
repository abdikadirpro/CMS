import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Shared About-page layout used by the main landing, Ethics portal, and Membership portal — only
 * the content differs per portal. `intro` is an array of paragraphs shown under the title;
 * `sections` renders as a numbered, divider-separated document flow (not a card grid) so longer
 * prose reads comfortably, with a quick-jump nav for pages with many sections. Each section can
 * carry an explicit `id` for deep-linking (e.g. `/ethics/about#process`) — falls back to a slug
 * of its heading otherwise.
 */
export default function AboutPage({ title, intro = [], sections = [] }) {
  const { hash } = useLocation();

  // React Router doesn't auto-scroll to a URL hash on navigation (only real browser page loads
  // do that natively) — this makes deep links like /ethics/about#process actually land on the
  // target section instead of the top of the page.
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, sections]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        {intro.map((paragraph, i) => (
          <p key={i} className="mt-3 text-[rgb(var(--fg-muted))]">{paragraph}</p>
        ))}
      </div>

      {sections.length > 3 && (
        <nav className="mt-10 flex flex-wrap justify-center gap-2 border-y border-[rgb(var(--border))] py-4">
          {sections.map((s) => (
            <a
              key={s.heading}
              href={`#${s.id || slugify(s.heading)}`}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-[rgb(var(--fg-muted))] transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {s.heading}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-4 divide-y divide-[rgb(var(--border))]">
        {sections.map((section, i) => (
          <motion.section
            key={section.heading}
            id={section.id || slugify(section.heading)}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="scroll-mt-24 py-10 sm:flex sm:gap-8"
          >
            <div className="mb-4 flex items-center gap-4 sm:mb-0 sm:w-20 sm:shrink-0 sm:flex-col sm:items-start">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-lg font-semibold leading-tight sm:hidden">{section.heading}</h2>
            </div>
            <div className="sm:flex-1">
              <h2 className="mb-2 hidden text-lg font-semibold leading-tight sm:block">{section.heading}</h2>
              <p className="text-[15px] leading-relaxed text-[rgb(var(--fg-muted))]">{section.body}</p>
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
