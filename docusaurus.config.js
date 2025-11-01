// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DBMarket',
  tagline: 'From Noise to Trust',
  favicon: 'img/favicon.ico',

  future: { v4: true },

  // ---------- GitHub Pages ----------
  url: 'https://jademichel.github.io',
  baseUrl: '/noname_app/',
  organizationName: 'jademichel',
  projectName: 'noname_app',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/jademichel/noname_app/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: { type: ['rss','atom'], xslt: true },
          editUrl: 'https://github.com/jademichel/noname_app/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],

  themeConfig: ({
    image: 'img/docusaurus-social-card.jpg',
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'DBMarket',
      logo: { alt: 'DBMarket Logo', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Docs' },
        { to: '/blog', label: 'Blog', position: 'left' },
        { href: 'https://github.com/jademichel/noname_app', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        { title: 'Docs', items: [{ label: 'Intro', to: '/docs/intro' }] },
        { title: 'Community', items: [
          { label: 'Stack Overflow', href: 'https://stackoverflow.com/questions/tagged/docusaurus' },
          { label: 'Discord', href: 'https://discordapp.com/invite/docusaurus' },
          { label: 'X', href: 'https://x.com/docusaurus' },
        ]},
        { title: 'More', items: [
          { label: 'Blog', to: '/blog' },
          { label: 'GitHub', href: 'https://github.com/jademichel/noname_app' },
        ]},
      ],
      copyright: `Copyright © ${new Date().getFullYear()} DBMarket. Built with Docusaurus.`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  }),
};

export default config;
