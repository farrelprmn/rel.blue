import { useAuth, useUser } from "@clerk/nextjs";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useId, useRef, useState } from "react";
import { isLeaving, transitionTo } from "@/components/navigation";
import Typewriter from "@/components/typewriter";
import { TROPHY } from "@/lib/trophy";

// signed-in only (Clerk). projects and achievements come from the database through /api/projects
// and /api/achievements, and every save / delete goes straight back there (lib/content.js);
// images upload to S3 through /api/upload. the fields follow presequities/uml.uxf
const PROJECT_FIELDS = [
  { key: "name", label: "name", required: true, maxLength: 50 },
  {
    key: "slug",
    label: "slug",
    maxLength: 50,
    placeholder: "from the name if empty",
  },
  { key: "period", label: "duration", maxLength: 50 },
  // `upload` names the S3 folder (rel.blue/<folder>/) the button puts files in
  { key: "image", label: "image", upload: "projects" },
  { key: "href", label: "link" },
  { key: "text", label: "description", rows: 4 },
];

const ACHIEVEMENT_FIELDS = [
  { key: "name", label: "name", required: true, maxLength: 100 },
  { key: "award", label: "award" },
  { key: "year", label: "year", type: "number", min: 1901, max: 2155 },
  { key: "tier", label: "trophy", options: Object.keys(TROPHY) },
  { key: "text", label: "description", rows: 4 },
  {
    key: "images",
    label: "images",
    rows: 2,
    placeholder: "one link per line",
    upload: "achievement",
  },
];

const pad = (n) => String(n).padStart(2, "0");
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "untitled";

// json in and out of the API; a failed call throws the server's message
async function api(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
  return data;
}

// picks an image and sends it to S3 (rel.blue/<folder>/), then hands back its public URL
function UploadButton({ folder, onUrl, onError }) {
  const file = useRef(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={() => file.current.click()}
      >
        {busy ? "uploading…" : "upload"}
      </button>
      <input
        ref={file}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        hidden
        onChange={async (e) => {
          const f = e.target.files[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          onError(null);
          try {
            const res = await fetch(
              `/api/upload?folder=${folder}&name=${encodeURIComponent(f.name)}`,
              { method: "POST", headers: { "Content-Type": f.type }, body: f },
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "upload failed");
            onUrl(data.url);
          } catch (err) {
            onError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

// the project window again, holding a form: one labelled line per field, cancel / save underneath.
// onSave goes to the database; the form stays open (with the reason) if that fails
function Editor({ path, fields, values, onSave, onCancel }) {
  const form = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // an uploaded image's URL goes in its field: replacing a single link, added as a line to a list
  const put = (key, url) => {
    const el = form.current.elements.namedItem(key);
    el.value =
      el.tagName === "TEXTAREA" && el.value.trim()
        ? `${el.value.trimEnd()}\n${url}`
        : url;
  };
  return (
    <form
      ref={form}
      className="project-window panel dash-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await onSave(Object.fromEntries(new FormData(e.currentTarget)));
        } catch (err) {
          setError(err.message);
          setBusy(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="project-bar">
        <span className="project-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{path}</span>
      </div>
      <div className="form-body">
        {fields.map(({ key, label, rows, options, upload, ...input }, i) => {
          const control = options ? (
            <select name={key} defaultValue={values[key]}>
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : rows ? (
            <textarea
              name={key}
              rows={rows}
              defaultValue={
                Array.isArray(values[key])
                  ? values[key].join("\n")
                  : values[key]
              }
              {...input}
            />
          ) : (
            <input
              name={key}
              type="text"
              defaultValue={values[key]}
              // the form opens because you asked to type into it
              autoFocus={i === 0}
              {...input}
            />
          );
          return (
            <label key={key} className="field">
              <span>{label}</span>
              {upload ? (
                <span className="field-upload">
                  {control}
                  <UploadButton
                    folder={upload}
                    onUrl={(url) => put(key, url)}
                    onError={setError}
                  />
                </span>
              ) : (
                control
              )}
            </label>
          );
        })}
      </div>
      <div className="form-foot">
        {error && (
          <span className="form-error" role="alert">
            {error}
          </span>
        )}
        <button type="button" className="btn" onClick={onCancel}>
          cancel
        </button>
        <button type="submit" className="btn go" disabled={busy}>
          {busy ? "saving…" : "save"} <span aria-hidden="true">↵</span>
        </button>
      </div>
    </form>
  );
}

// asks once: the first click turns it red for a few seconds, a second click deletes
function DeleteButton({ onDelete }) {
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const t = setTimeout(() => setSure(false), 3000);
    return () => clearTimeout(t);
  }, [sure]);
  return (
    <button
      type="button"
      className={sure ? "btn danger" : "btn"}
      disabled={busy}
      onClick={async () => {
        if (!sure) return setSure(true);
        setBusy(true);
        // on success the row is gone; on failure it stays and says so
        if (!(await onDelete())) {
          setBusy(false);
          setSure(false);
        }
      }}
    >
      {busy ? "deleting…" : sure ? "sure?" : "delete"}
    </button>
  );
}

// projects 04 - - - - - - - - - + new, then one row per entry; a row being edited turns into its form
// `items` is null while loading. new entries go to the top of the list until the next load sorts them
function Section({
  title,
  path,
  fields,
  blank,
  items,
  setItems,
  row,
  className,
}) {
  const id = useId();
  const url = `/api/${path}`;
  // an item's id, "new", or null
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const save = async (data) => {
    const item =
      editing === "new"
        ? await api(url, "POST", data)
        : await api(`${url}/${editing}`, "PUT", data);
    setItems((list) =>
      editing === "new"
        ? [item, ...list]
        : list.map((it) => (it.id === editing ? item : it)),
    );
    setEditing(null);
  };
  const remove = async (itemId) => {
    try {
      await api(`${url}/${itemId}`, "DELETE");
      setItems((list) => list.filter((x) => x.id !== itemId));
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };
  const cancel = () => setEditing(null);

  return (
    <section className="dash-section" aria-labelledby={id}>
      <div className="project-rule dash-head">
        <h2 id={id} className="project-no">
          {title}
        </h2>
        <span className="project-of">{items ? pad(items.length) : "··"}</span>
        <span className="project-line" aria-hidden="true" />
        <button
          type="button"
          className="btn"
          onClick={() => setEditing("new")}
          disabled={!items || editing === "new"}
        >
          + new
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <ul className={`dash-list ${className ?? ""}`}>
        {editing === "new" && (
          <li>
            <Editor
              path={`~/${path}/new`}
              fields={fields}
              values={blank}
              onSave={save}
              onCancel={cancel}
            />
          </li>
        )}
        {items?.map((it) => (
          <li key={it.id}>
            {editing === it.id ? (
              <Editor
                path={`~/${path}/${it.slug || slugify(it.name)}`}
                fields={fields}
                values={it}
                onSave={save}
                onCancel={cancel}
              />
            ) : (
              <div className="dash-row">
                <div className="dash-main">{row(it)}</div>
                <div className="dash-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditing(it.id)}
                  >
                    edit
                  </button>
                  <DeleteButton onDelete={() => remove(it.id)} />
                </div>
              </div>
            )}
          </li>
        ))}
        {!items && <li className="dash-empty">loading…</li>}
        {items?.length === 0 && editing !== "new" && (
          <li className="dash-empty">nothing here yet</li>
        )}
      </ul>
    </section>
  );
}

// sessions already written to the `user` table on this visit
const synced = new Set();

export default function Dashboard() {
  const router = useRouter();
  const { isLoaded, isSignedIn, sessionId } = useAuth();
  const { user } = useUser();
  // proxy.js turns away full page loads without a session; this covers client-side moves here
  // (and signing out in another tab)
  useEffect(() => {
    if (isLoaded && !isSignedIn) transitionTo(router, "/d/login");
  }, [isLoaded, isSignedIn, router]);

  // Clerk let them in, so they go in the database (pages/api/auth/sync.js); once per login
  const [syncFailed, setSyncFailed] = useState(false);
  useEffect(() => {
    if (!sessionId || synced.has(sessionId)) return;
    synced.add(sessionId);
    fetch("/api/auth/sync", { method: "POST" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
      })
      .catch(() => {
        synced.delete(sessionId);
        setSyncFailed(true);
      });
  }, [sessionId]);

  const [projects, setProjects] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [loadFailed, setLoadFailed] = useState(null);
  useEffect(() => {
    if (!isSignedIn) return;
    Promise.all([api("/api/projects"), api("/api/achievements")])
      .then(([p, a]) => {
        setProjects(p);
        setAchievements(a);
      })
      .catch((err) => setLoadFailed(err.message));
  }, [isSignedIn]);

  const head = (
    <Head>
      <title>Dashboard · Farrel&apos;s Portofolio</title>
      <meta name="robots" content="noindex" />
    </Head>
  );
  // nothing to show until Clerk knows who this is; on logout the content stays while the page fades
  if (!isSignedIn && !isLeaving())
    return <div className="page center">{head}</div>;

  const name = (user?.firstName || "farrel").toLowerCase();
  return (
    <div className="page center">
      {head}
      <Typewriter as="h1" text={`welcome back, ${name}.`} />
      {(syncFailed || loadFailed) && (
        <p className="dash-note form-error" role="alert">
          {loadFailed
            ? `couldn't load from the database: ${loadFailed}`
            : "couldn't save your login to the database."}
        </p>
      )}
      <Section
        title="projects"
        path="projects"
        className="projects"
        fields={PROJECT_FIELDS}
        blank={{}}
        items={projects}
        setItems={setProjects}
        row={(p) => (
          <>
            <h3>
              {p.name} {p.period && <span className="meta">{p.period}</span>}
            </h3>
            {p.text && <p>{p.text}</p>}
          </>
        )}
      />
      <Section
        title="achievements"
        path="achievements"
        fields={ACHIEVEMENT_FIELDS}
        blank={{ year: new Date().getFullYear(), tier: "gold", images: [] }}
        items={achievements}
        setItems={setAchievements}
        row={(a) => (
          <div className="award">
            <span className="trophy" style={{ color: TROPHY[a.tier] }}>
              <FontAwesomeIcon icon={faTrophy} aria-hidden="true" />
            </span>
            <div>
              <h3>
                {a.name}{" "}
                <span className="meta">
                  {[a.award, a.year].filter(Boolean).join(" · ")}
                </span>
              </h3>
              {a.text && <p>{a.text}</p>}
            </div>
          </div>
        )}
      />
    </div>
  );
}
