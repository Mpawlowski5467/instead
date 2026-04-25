import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const CATEGORIES = [
  'notes',
  'design',
  'video-calls',
  'email',
  'analytics',
  'storage',
  'chat',
  'dev-tools',
  'social',
  'productivity',
  'other',
] as const;

const TAGS = [
  'free',
  'open-source',
  'self-hostable',
  'offline',
  'no-account',
  'e2e-encrypted',
  'local-first',
  'cli',
  'paid-tier-available',
] as const;

const PLATFORMS = ['web', 'macos', 'windows', 'linux', 'ios', 'android'] as const;

const tools = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/tools' }),
  schema: z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
    category: z.enum(CATEGORIES),
    description: z.string().min(1).max(120, 'description must be <= 120 chars'),
    website: z.string().url(),
    proprietary: z.boolean().default(true),
  }),
});

const alternatives = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/alternatives' }),
  schema: z.object({
    name: z.string().min(1),
    replaces: z.array(reference('tools')).min(1, 'replaces must reference at least one tool'),
    description: z.string().min(1).max(120, 'description must be <= 120 chars'),
    website: z.string().url(),
    repo: z.string().url().optional(),
    license: z.string().min(1),
    tags: z.array(z.enum(TAGS)).default([]),
    platforms: z.array(z.enum(PLATFORMS)).default([]),
  }),
});

export const collections = { tools, alternatives };
