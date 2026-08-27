import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 遗留 HTTP/服务层在边界处使用 any（透传后端结构），降为 warn 不阻塞 lint
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // shadcn 生成组件（导出 cva variants 常量属官方模式）、
    // 应用入口与路由配置（非可热刷新的组件模块）
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/main.tsx',
      'src/router/index.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
