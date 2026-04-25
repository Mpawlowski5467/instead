import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
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
  meta: string;
  type: 'tool' | 'alternative';
}

const MAX_RESULTS = 8;

export default function SearchIsland() {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadStarted = useRef(false);

  const ensureLoaded = () => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    fetch('/search-index.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Entry[]) => setEntries(data))
      .catch(() => setLoadingFailed(true));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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

  const onSubmit = (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (results.length > 0) {
      window.location.href = results[0].href;
    }
  };

  const onInputKey = (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit} role="search">
        <label for="search" class="visually-hidden">
          Search alternatives
        </label>
        <input
          id="search"
          ref={inputRef}
          class="search-input"
          autoFocus
          type="search"
          autoComplete="off"
          spellcheck={false}
          placeholder="Notion, Zoom, Photoshop..."
          value={query}
          onInput={(e) => {
            ensureLoaded();
            setQuery((e.currentTarget as HTMLInputElement).value);
          }}
          onFocus={ensureLoaded}
          onKeyDown={onInputKey}
        />
      </form>

      {query.trim().length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!entries && !loadingFailed && (
            <p class="muted" style={{ fontSize: 14, margin: 0 }}>
              Loading…
            </p>
          )}
          {loadingFailed && (
            <p class="muted" style={{ fontSize: 14, margin: 0 }}>
              Could not load search index. Try <a href="/all" class="accent">/all</a>.
            </p>
          )}
          {entries && results.length === 0 && (
            <p class="muted" style={{ fontSize: 14, margin: 0 }}>
              Nothing yet. <a href="/submit" class="accent">Suggest one →</a>
            </p>
          )}
          {results.map((r) => (
            <a key={r.href + r.name} href={r.href} class="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{r.name}</h3>
                <span class="chip" style={{ fontSize: 11 }}>[ {r.type} ]</span>
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
