import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

interface SearchEntry {
  type: 'tool' | 'alternative';
  name: string;
  slug: string; // tool slug to navigate to
  href: string; // /replaces/<slug>
  category?: string;
  replaces?: string[];
  tags?: string[];
  description: string;
}

async function readYamlDir(dir: string) {
  const files = await readdir(dir);
  return Promise.all(
    files
      .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
      .map(async (f) => parseYaml(await readFile(join(dir, f), 'utf8')) as Record<string, unknown>),
  );
}

export async function buildSearchIndex(rootUrl: URL) {
  const root = fileURLToPath(rootUrl);
  const tools = (await readYamlDir(join(root, 'src/content/tools'))) as Array<{
    name: string;
    slug: string;
    category: string;
    description: string;
  }>;
  const alts = (await readYamlDir(join(root, 'src/content/alternatives'))) as Array<{
    name: string;
    replaces: string[];
    description: string;
    tags?: string[];
  }>;

  const entries: SearchEntry[] = [];

  for (const tool of tools) {
    entries.push({
      type: 'tool',
      name: tool.name,
      slug: tool.slug,
      href: `/replaces/${tool.slug}`,
      category: tool.category,
      description: tool.description,
    });
  }

  for (const alt of alts) {
    // each alternative gets one searchable entry per tool it replaces
    for (const replaceSlug of alt.replaces) {
      entries.push({
        type: 'alternative',
        name: alt.name,
        slug: replaceSlug,
        href: `/replaces/${replaceSlug}`,
        replaces: alt.replaces,
        tags: alt.tags ?? [],
        description: alt.description,
      });
    }
  }

  const outDir = join(root, 'public');
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'search-index.json'), JSON.stringify(entries));
  return entries.length;
}
