// All values are sourced from the .env file (PUBLIC_* are exposed at build time).
const repo = import.meta.env.PUBLIC_GITHUB_REPO ?? 'instead-directory/instead';
const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'https://instead.example';

export const SITE = {
  url: siteUrl,
  repo,
  repoUrl: `https://github.com/${repo}`,
  editFileUrl: (path: string) => `https://github.com/${repo}/edit/main/${path}`,
  newFileUrl: (dir: string, filename: string, value: string) =>
    `https://github.com/${repo}/new/main/${dir}?filename=${encodeURIComponent(
      filename,
    )}&value=${encodeURIComponent(value)}`,
};
