import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Puzzlebox Docs',
  description: 'Agent-first game backend for daily-play newsroom games',
  cleanUrls: true,
  appearance: false,
  themeConfig: {
    logo: '/logo-block.svg',
    siteTitle: 'PuzzleBox',
    nav: [
      { text: 'Agent Quickstart', link: '/agent-quickstart' },
      { text: 'Game Spec', link: '/game-spec-template' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'API', link: '/api/overview' },
      { text: 'SDK', link: '/sdk' }
    ],
    sidebar: [
      {
        text: 'Agent Build',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Agent Quickstart', link: '/agent-quickstart' },
          { text: 'Game Spec Template', link: '/game-spec-template' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'SDK', link: '/sdk' }
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
          { text: 'Sheets Sync', link: '/sheets-sync' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/superfunteam/puzzlebox' }
    ]
  }
});
