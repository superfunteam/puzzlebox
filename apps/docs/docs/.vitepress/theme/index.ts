import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import './custom.css';
import NavAudienceToggle from './components/NavAudienceToggle.vue';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(NavAudienceToggle)
    })
};
