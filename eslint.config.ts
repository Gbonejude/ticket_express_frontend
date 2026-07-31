import js from '@eslint/js'
import pluginVitest from '@vitest/eslint-plugin'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { globalIgnores } from 'eslint/config'

/**
 * ESLint flat config.
 *
 * Scope: correctness only. Formatting is Prettier's job, and
 * `skipFormatting` turns off every stylistic rule that would otherwise fight
 * it. This is the main departure from the back-office config, which encodes
 * `semi`, `indent`, `comma-dangle` and friends as ESLint errors and therefore
 * has two tools with opinions about the same character.
 */
export default defineConfigWithVueTs(
  globalIgnores(['dist/**', 'coverage/**', 'node_modules/**', 'public/**']),

  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'app/rules',
    rules: {
      // Page and layout components are named for their route; a one-word name
      // like `HomePage.vue` is intentional.
      'vue/multi-word-component-names': 'off',

      // `_`-prefixed arguments are deliberately unused (router guards, catch).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Request bodies are snake_case because the API expects them that way.
      camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],

      // `any` erases the point of typing the API layer.
      '@typescript-eslint/no-explicit-any': 'error',

      // Leftover debugging must not reach production.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',

      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'object-shorthand': ['error', 'properties'],
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/*.{test,spec}.ts', 'src/__tests__/**/*.ts'],
  },

  skipFormatting,
)
