import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import AgentWorkflowSection from './components/AgentWorkflowSection.vue';
import InsideBoxSection from './components/InsideBoxSection.vue';
import HeroMarkTyping from './components/HeroMarkTyping.vue';
import FaqSection from './components/FaqSection.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: { component: (name: string, component: unknown) => void } }) {
    app.component('AgentWorkflowSection', AgentWorkflowSection);
    app.component('InsideBoxSection', InsideBoxSection);
    app.component('FaqSection', FaqSection);
  },
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-hero-info-before': () => h(HeroMarkTyping)
    })
};
