import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ['**/*.{ts,tsx}'],

        languageOptions: {
            parser: tseslint.parser,

            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },

            globals: {
                ...globals.browser
            }
        },

        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },

        settings: {
            react: {
                version: 'detect'
            }
        },

        rules: {

            // React Compiler critical
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Vite fast refresh safety
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true }
            ],

            // Useful TS safety
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],

            '@typescript-eslint/consistent-type-imports': 'warn',

            // Usually too noisy otherwise
            '@typescript-eslint/no-explicit-any': 'off',

            // React 19
            'react/react-in-jsx-scope': 'off'
        }
    }
]
