import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clamp } from "./cat/geometry";

// popup for any element with data-role (data-period and data-text are optional):
// hover with a mouse, first tap on touch (a second tap follows the link).
// rendered by _app outside the page-transition wrapper, so nothing the transition leaves on that
// wrapper can drop the card under the cat canvas; it re-binds to the new page's links on each route
export default function InfoCard() {
  const ref = useRef(null);
  const { pathname } = useRouter();
  // { el, role, period, text, href } of the element the card is (or was last) about
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    const ac = new AbortController();
    const { signal } = ac;
    const canHover = matchMedia("(hover: hover)");
    let cardFor = null,
      hideT = 0;

    const show = (a) => {
      clearTimeout(hideT);
      const d = a.dataset;
      cardFor = a;
      setInfo({
        el: a,
        role: d.role || "",
        period: d.period || "",
        text: d.text || "",
        // the greeting has no site to open
        href: a instanceof HTMLAnchorElement ? a.href : "",
      });
      setOpen(true);
    };
    const hide = (delay = 0) => {
      clearTimeout(hideT);
      hideT = setTimeout(() => {
        cardFor = null;
        setOpen(false);
      }, delay);
    };

    document.querySelectorAll("[data-role]").forEach((a) => {
      a.addEventListener(
        "pointerenter",
        (e) => {
          if (e.pointerType === "mouse") show(a);
        },
        { signal },
      );
      a.addEventListener(
        "pointerleave",
        (e) => {
          if (e.pointerType === "mouse") hide(150);
        },
        { signal },
      );
      a.addEventListener(
        "focus",
        () => {
          if (a.matches(":focus-visible")) show(a);
        },
        { signal },
      );
      a.addEventListener("blur", () => hide(150), { signal });
      a.addEventListener(
        "click",
        (e) => {
          if (!canHover.matches && cardFor !== a) {
            e.preventDefault();
            show(a);
          }
        },
        { signal },
      );
    });
    card.addEventListener("pointerenter", () => clearTimeout(hideT), {
      signal,
    });
    card.addEventListener(
      "pointerleave",
      (e) => {
        if (e.pointerType === "mouse") hide(150);
      },
      { signal },
    );
    card.addEventListener("focusin", () => clearTimeout(hideT), { signal });
    card.addEventListener("focusout", () => hide(150), { signal });
    card
      .querySelector(".card-x")
      ?.addEventListener("click", () => hide(), { signal });
    addEventListener(
      "pointerdown",
      (e) => {
        const inside =
          e.target instanceof Element &&
          e.target.closest(".card, [data-role]");
        if (cardFor && !inside) hide();
      },
      { signal },
    );
    addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") hide();
      },
      { signal },
    );
    addEventListener("resize", () => hide(), { signal });

    return () => {
      ac.abort();
      clearTimeout(hideT);
    };
  }, [pathname]);

  // place above the link, or below it when there's no room
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card || !info) return;
    const r = info.el.getBoundingClientRect(),
      cw = card.offsetWidth,
      ch = card.offsetHeight;
    card.style.left = clamp(r.left - 16, 16, innerWidth - cw - 16) + "px";
    card.style.top =
      (r.top - ch - 10 >= 16 ? r.top - ch - 10 : r.bottom + 10) + "px";
  }, [info]);

  // while a card is open, everything but its link fades to the tagline grey
  useEffect(() => {
    if (!open || !info) return;
    const el = info.el;
    el.classList.add("lit");
    document.body.classList.add("carding");
    return () => {
      el.classList.remove("lit");
      document.body.classList.remove("carding");
    };
  }, [open, info]);

  return (
    <div ref={ref} className={open ? "card on" : "card"} role="tooltip">
      <div className="card-head">
        <span className="card-dots">
          <button type="button" className="card-x" aria-label="Close">
            ×
          </button>
          <span className="card-min" aria-hidden="true"></span>
          <span className="card-max" aria-hidden="true"></span>
        </span>
        <span className="card-period">{info?.period}</span>
      </div>
      <p className="card-role">{info?.role}</p>
      <p className="card-text">{info?.text}</p>
      <a
        className="card-open"
        href={info?.href || "#"}
        target="_blank"
        rel="noopener"
        style={info && !info.href ? { display: "none" } : undefined}
      >
        open site <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
