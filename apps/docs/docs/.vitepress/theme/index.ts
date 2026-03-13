import DefaultTheme from 'vitepress/theme';
import './custom.css';
import AudienceModeHome from './components/AudienceModeHome.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AudienceModeHome', AudienceModeHome);
  }
};
