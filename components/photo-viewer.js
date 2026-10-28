import { useEffect, useRef, useState } from "react";
import AsciiImage from "@/components/ascii-image";
import Carousel from "@/components/carousel";
import { optimisable } from "@/lib/images";

export default function PhotoViewer({ title, photos, onClose }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => el.open && el.close();
  }, []);

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
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget && !e.pseudoElement)
          dialog.current.close();
      }}
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
