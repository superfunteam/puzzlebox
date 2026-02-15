import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Puzzlebox Docs',
  description: 'Agent-first game backend for daily-play newsroom games',
  cleanUrls: true,
  themeConfig: {
    logo: '/logo-block.svg',
    nav: [
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'API', link: '/api/overview' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'SDK', link: '/sdk' }
    ],
    sidebar: [
      {
        text: 'Get Started',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Architecture', link: '/architecture' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/api/overview' },
          { text: 'Auth', link: '/api/auth' },
          { text: 'Games', link: '/api/games' },
          { text: 'Editions & Rounds', link: '/api/editions-rounds' },
          { text: 'Sessions & Gameplay', link: '/api/sessions' },
          { text: 'Players', link: '/api/players' },
          { text: 'Analytics', link: '/api/analytics' },
          { text: 'Rate Limits', link: '/api/rate-limits' },
          { text: 'Errors', link: '/api/errors' }
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'SDK', link: '/sdk' },
          { text: 'Sheets Sync', link: '/sheets-sync' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/puzzlebox-games/puzzlebox' }
    ]
  }
});
