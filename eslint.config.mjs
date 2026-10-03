import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'backups/**', '.build/**', '.test-build/**'] },
  ...tseslint.configs.recommended,
  { files: ['src/**/*.ts'], rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error'
  }},
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } }
);
