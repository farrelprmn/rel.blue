import { useClerk } from "@clerk/nextjs";
import { animate, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { exitCat } from "./cat/controls";

// page transition: the old page blurs + fades out while the cat arcs up over the middle,
// then the new page blurs + fades in while it comes down the other side and drops off the bottom
let stage = null;
let entering = false;
let leaving = false;
let busy = false;

// true while the old page is fading out; the scene canvas freezes so the blur isn't redone every frame
export const isLeaving = () => leaving;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const blur = (px) => (reduced() ? "blur(0px)" : `blur(${px}px)`);
const BLUR = 8;
const OUT = { duration: 0.9, ease: [0.4, 0, 0.2, 1] };
const IN = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };

// drop the inline styles so the stage stops being a stacking context / containing block
const settle = (el) =>
  ["opacity", "filter", "transform", "will-change"].forEach((p) =>
    el.style.removeProperty(p),
  );

export function PageTransition({ children }) {
  const ref = useRef(null);
  const router = useRouter();
  const { pathname } = router;

  useEffect(() => {
    stage = ref.current;
    // the load-only intro animations in globals.css stop once we've moved between pages
    // (nav links, back/forward alike)
    const navigated = () => document.documentElement.classList.add("navigated");
    router.events.on("routeChangeStart", navigated);
    return () => {
      stage = null;
      router.events.off("routeChangeStart", navigated);
    };
  }, [router.events]);

  // the new page is already in the DOM, still invisible from the exit; bring it in
  useEffect(() => {
    const el = ref.current;
    if (!el || !entering) return;
    entering = false;
    leaving = false;
    animate(
      el,
      {
        opacity: [0, 1],
        filter: [blur(BLUR), "blur(0px)"],
        scale: [reduced() ? 1 : 1.015, 1],
      },
      IN,
    ).then(() => settle(el));
  }, [pathname]);

  return (
    <div ref={ref} className="stage">
      {children}
    </div>
  );
}

// the same way out as a link, for code (a form submit) that moves to another page.
// if onGo returns a promise (signing out), the new page waits for it as well as the fade
export function transitionTo(router, href, onGo) {
  if (busy || href === router.pathname) return;
  busy = true;
  leaving = true;
  const going = onGo?.();
  let fade = null;
  if (stage) {
    stage.style.willChange = "opacity, filter, transform";
    fade = animate(
      stage,
      {
        opacity: [1, 0],
        filter: ["blur(0px)", blur(BLUR)],
        scale: [1, reduced() ? 1 : 0.985],
      },
      OUT,
    );
  }
  Promise.all([fade, exitCat(), router.prefetch(href).catch(() => {}), going])
    .then(() => {
      entering = true;
      return router.push(href);
    })
    .catch(() => {
      // navigation failed: put the old page back
      entering = leaving = false;
      if (stage) settle(stage);
    })
    .finally(() => {
      busy = false;
    });
}

export function TransitionLink({ href, onGo, ...props }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      {...props}
      onNavigate={(e) => {
        e.preventDefault();
        transitionTo(router, href, onGo);
      }}
    />
  );
}

const LINKS = [
  { href: "/", label: "home" },
  { href: "/projects", label: "projects" },
  { href: "/achievements", label: "achievements" },
  // its own site: a plain link in a new tab, no page transition
  { href: "https://forest.rel.blue", label: "forest" },
];

// the dashboard keeps the same header, with logout where forest was: it signs out of Clerk while the
// page fades, then lands on the login page
const DASHBOARD_LINKS = [
  ...LINKS.slice(0, 3),
  { href: "/d/login", label: "logout", signOut: true },
];

// where the square sits on a page: its own link, except the dashboard (not in the header), where
// it rests on logout
const restingSpot = (pathname) =>
  pathname === "/d/dashboard" ? "/d/login" : pathname;

// header lives in _app, outside the transition, so it never blurs.
// desktop: one quiet line of links. phones: a blurred pill (name + menu button) that opens
// the links as a full-screen menu; .bar and .menu are laid out by globals.css
export function Nav() {
  const { pathname } = useRouter();
  const { signOut } = useClerk();
  // the square moves on click, not after the page has changed; it follows the route for back/forward
  const [active, setActive] = useState(() => restingSpot(pathname));
  const [seen, setSeen] = useState(pathname);
  const [open, setOpen] = useState(false);
  if (pathname !== seen) {
    setSeen(pathname);
    setActive(restingSpot(pathname));
    setOpen(false);
  }
  const close = () => setOpen(false);
  const links = pathname === "/d/dashboard" ? DASHBOARD_LINKS : LINKS;

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") setOpen(false);
      },
      { signal: ac.signal },
    );
    return () => ac.abort();
  }, [open]);

  return (
    <header className={open ? "site-nav open" : "site-nav"}>
      <div className="bar">
        <TransitionLink
          href="/"
          className="brand"
          onClick={close}
          onGo={() => setActive("/")}
        >
          Farrel&apos;s Portofolio
        </TransitionLink>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            {open ? (
              <path
                d="M4 4l10 10M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <g fill="currentColor">
                <circle cx="6" cy="6" r="1.5" />
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
              </g>
            )}
          </svg>
        </button>
      </div>
      <div className="menu" id="site-menu">
        <nav aria-label="Main">
          {links.map(({ href, label, signOut: out }) =>
            !href.startsWith("/") ? (
              <a key={label} href={href} target="_blank" rel="noopener">
                {label}
              </a>
            ) : (
              <TransitionLink
                key={label}
                href={href}
                aria-current={href === pathname ? "page" : undefined}
                // highlight follows the square (moves on click), aria-current follows the real route
                className={href === active ? "on" : undefined}
                onClick={close}
                onGo={() => {
                  setActive(href);
                  // a callback instead of Clerk's own redirect, so the transition does the navigating
                  if (out) return signOut(() => {});
                }}
              >
                {href === active && (
                  <motion.span
                    layoutId="nav-dot"
                    className="nav-dot"
                    aria-hidden="true"
                    transition={{
                      type: "spring",
                      visualDuration: 0.5,
                      bounce: 0.45,
                    }}
                  >
                    ■
                  </motion.span>
                )}
                {label}
              </TransitionLink>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
