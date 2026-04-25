# instead.

A static, open-source directory of free, privacy-first, open-source alternatives to popular apps and services.

Type the name of something you'd like to replace and you get a short list of projects worth trying. There's no backend, no auth, no analytics, and no tracking. Every entry is a YAML file in this repository — Git is the database.

**Live**: _coming soon_ (Cloudflare Pages)

## How it works

- **Astro** generates the static site
- **Zod** validates the content schema and the cross-references between alternatives and the tools they replace
- **Fuse.js** powers a single client-side search island, lazily loaded on first interaction
- **Cloudflare Pages** serves the static output
- **GitHub Actions** runs schema validation and link checks on every PR

## How to contribute

Every change is a pull request that adds or edits a YAML file.

### Add an alternative

1. Open the [GitHub editor for a new alternative](https://github.com/instead-directory/instead/new/main/src/content/alternatives).
2. Name the file `your-project.yml` (lowercase, kebab-case).
3. Fill in the template:

   ```yaml
   name: Project name
   replaces:
     - notion
   description: One sentence, max 120 chars, written as a continuation of "[name] is a..."
   website: https://example.com
   repo: https://github.com/org/project
   license: MIT
   tags:
     - free
     - open-source
     - self-hostable
   platforms:
     - web
     - macos
     - linux
   ```

4. Commit to a new branch on your fork, then open a pull request.
5. CI will run schema validation and link checks. After review, it's merged and live.

### Add a tool (the popular thing being replaced)

```yaml
name: Tool name
slug: tool-name
category: notes
description: One sentence, max 120 chars.
website: https://example.com
proprietary: true
```

Categories: `notes`, `design`, `video-calls`, `email`, `analytics`, `storage`, `chat`, `dev-tools`, `social`, `productivity`, `other`.

### What makes a good submission

- The project is actively maintained.
- It's free to use, even if a paid tier exists.
- License is a real OSI-approved or commonly-recognized SPDX identifier.
- The description reads as a continuation of "[name] is a..." — no marketing words.
- You'd genuinely recommend it to a friend.

Banned words in descriptions: _powerful_, _seamless_, _revolutionary_, _modern_, _beautiful_, _amazing_, _platform_.

## Local development

```sh
git clone https://github.com/instead-directory/instead.git
cd instead
cp .env.example .env
npm install
npm run dev
```

Open <http://127.0.0.1:4321>.

### Other commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Build the static site to `dist/` (also runs Zod schema validation) |
| `npm run preview` | Preview the production build |
| `npm run check` | Run `astro check` (TypeScript + Astro type errors) |
| `npm run check:links` | HEAD every `website` and `repo` URL in the YAMLs |

`npm run check:links --skip-link-check` is a no-op, useful for skipping the network check locally.

### Project layout

```
src/
├── content/
│   ├── config.ts         # Zod schemas
│   ├── tools/            # the popular things being replaced
│   └── alternatives/     # the open-source replacements
├── components/
│   ├── Layout.astro
│   ├── ResultCard.astro
│   ├── TagChip.astro
│   ├── CompareTable.astro
│   └── SearchIsland.tsx  # the only client island
├── lib/
│   ├── site.ts                # env-driven URLs (PUBLIC_SITE_URL, PUBLIC_GITHUB_REPO)
│   └── build-search-index.ts  # emits public/search-index.json at build
├── pages/
│   ├── index.astro
│   ├── replaces/[slug].astro
│   ├── all.astro          # alphabetical fallback (works without JS)
│   ├── submit.astro
│   └── about.astro
└── styles/
    └── global.css         # CSS vars + a few utility classes
```

### Environment variables

Copy `.env.example` to `.env` and adjust:

```
PUBLIC_SITE_URL=https://your.deployment.url
PUBLIC_GITHUB_REPO=your-org/your-repo
```

Both are read at build time. `PUBLIC_GITHUB_REPO` drives the GitHub icon link, the "Suggest an edit" deep-links, and the `/submit` button.

## License

- **Code**: [MIT](./LICENSE) © contributors
- **Content** (the YAML entries in `src/content/`): [CC-BY-4.0](./LICENSE-CONTENT) © contributors

By submitting a pull request you agree to license your contributions under these terms.
