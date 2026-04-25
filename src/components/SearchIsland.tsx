import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Fuse from 'fuse.js';

interface Entry {
  type: 'tool' | 'alternative';
  name: string;
  slug: string;
  href: string;
  category?: string;
  replaces?: string[];
  tags?: string[];
  description: string;
}

interface DedupedResult {
  name: string;
  description: string;
  href: string;
  meta: string; // small line under the name (e.g. "replaces Notion" or "category")
  type: 'tool' | 'alternative';
}

const MAX_RESULTS = 8;

export default function SearchIsland() {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadStarted = useRef(false);

  // lazy-load search index on first interaction
  const ensureLoaded = () => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    fetch('/search-index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Entry[]) => setEntries(data))
      .catch(() => setLoadingFailed(true));
  };

  // global "/" focuses search
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fuse = useMemo(() => {
    if (!entries) return null;
    return new Fuse(entries, {
      keys: ['name', 'replaces', 'category', 'tags'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [entries]);

  const results: DedupedResult[] = useMemo(() => {
    if (!query.trim() || !fuse) return [];
    const raw = fuse.search(query.trim()).map((r) => r.item);
    // Dedupe by destination href (an alternative replacing 3 tools should appear 3x with different hrefs — but two entries pointing to same tool page should collapse to one)
    const seen = new Set<string>();
    const out: DedupedResult[] = [];
    for (const e of raw) {
      const key = `${e.type}:${e.name}:${e.href}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const meta =
        e.type === 'tool'
          ? `replace ${e.name}${e.category ? ` · ${e.category}` : ''}`
          : `alternative · replaces ${e.replaces?.join(', ') ?? ''}`;
      out.push({ name: e.name, description: e.description, href: e.href, meta, type: e.type });
      if (out.length >= MAX_RESULTS) break;
    }
    return out;
  }, [query, fuse]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (results.length === 1) {
      window.location.href = results[0].href;
    } else if (results.length > 0) {
      window.location.href = results[0].href;
    }
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="search" className="visually-hidden">
          Search alternatives
        </label>
        <input
          id="search"
          ref={inputRef}
          className="search-input"
          autoFocus
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Notion, Zoom, Photoshop..."
          value={query}
          onChange={(e) => {
            ensureLoaded();
            setQuery(e.target.value);
          }}
          onFocus={ensureLoaded}
          onKeyDown={onInputKey}
        />
      </form>

      {query.trim().length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!entries && !loadingFailed && (
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>
              Loading…
            </p>
          )}
          {loadingFailed && (
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>
              Could not load search index. Try <a href="/all" className="accent">/all</a>.
            </p>
          )}
          {entries && results.length === 0 && (
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>
              Nothing yet. <a href="/submit" className="accent">Suggest one →</a>
            </p>
          )}
          {results.map((r) => (
            <a key={r.href + r.name} href={r.href} className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{r.name}</h3>
                <span className="chip" style={{ fontSize: 11 }}>[ {r.type} ]</span>
              </div>
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 15 }}>{r.description}</p>
              <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {r.meta}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
