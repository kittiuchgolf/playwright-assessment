import eslint from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const configDirectory = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: ['node_modules/', 'playwright-report/', 'monocart-report/', 'test-results/']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: configDirectory
      }
    },
    plugins: {
      playwright
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'playwright/expect-expect': 'off',
      'playwright/no-conditional-in-test': 'off'
    }
  }
);
