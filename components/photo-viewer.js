import { useEffect, useRef, useState } from "react";
import AsciiImage from "@/components/ascii-image";
import Carousel from "@/components/carousel";
import { optimisable } from "@/lib/images";

// an achievement's photos in a popup: the info card's window (red light closes it) around the same
// carousel as the projects page, each photo drawn in with the ASCII skeleton. a modal <dialog>, so
// it sits above everything, keeps focus inside, and Escape or a click outside closes it. closing
// plays a short fade-out first (.closing in globals.css), and the dialog shuts when that ends.
// mount it to open it; onClose fires once it has closed
export default function PhotoViewer({ title, photos, onClose }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => el.open && el.close();
  }, []);

  // in case the fade-out's end never arrives, it still shuts a little after it should have
  const close = () => {
    setClosing(true);
    const el = dialog.current;
    setTimeout(() => el.open && el.close(), 450);
  };
  return (
    <dialog
      ref={dialog}
      className={closing ? "viewer closing" : "viewer"}
      aria-label={`Photos from ${title}`}
      onClose={onClose}
      // Escape: fade out like the other ways of closing, instead of vanishing
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      // only the window's own fade-out, not the backdrop's or anything inside it
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget && !e.pseudoElement)
          dialog.current.close();
      }}
      // the dialog box itself is only the backdrop around the window
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="project-window viewer-window">
        <div className="card-head">
          <span className="card-dots">
            <button
              type="button"
              className="card-x"
              aria-label="Close"
              onClick={close}
            >
              ×
            </button>
            <span className="card-min" />
            <span className="card-max" />
          </span>
          <span className="viewer-title">{title}</span>
          <span className="viewer-count">
            {index + 1} / {photos.length}
          </span>
        </div>
        <Carousel label={`Photos from ${title}`} every={0} onIndex={setIndex}>
          {photos.map((src, i) => (
            <AsciiImage
              key={`${i}-${src}`}
              className="viewer-shot"
              src={src}
              fill
              unoptimized={!optimisable(src)}
              alt={`${title}, photo ${i + 1}`}
              sizes="(max-width: 900px) 100vw, 860px"
            />
          ))}
        </Carousel>
      </div>
    </dialog>
  );
}
