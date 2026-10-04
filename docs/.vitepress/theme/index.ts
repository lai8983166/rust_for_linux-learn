import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import VersionBadge from './components/VersionBadge.vue'
import KernelTerm from './components/KernelTerm.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('VersionBadge', VersionBadge)
    app.component('KernelTerm', KernelTerm)
  },
} satisfies Theme
