import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'backups/**', '.build/**', '.test-build/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'requestAnimationFrame',
          message: 'Schedule animation frames on the owning element.win.',
        },
        {
          name: 'cancelAnimationFrame',
          message: 'Cancel animation frames on the owning element.win.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/^createElement(NS)?$/]',
          message: 'Use Obsidian createEl/createDiv/createSvg helpers.',
        },
        {
          selector: 'MemberExpression[property.name="activeLeaf"]',
          message: 'Use workspace.getActiveViewOfType instead of the deprecated activeLeaf.',
        },
        {
          selector: 'AssignmentExpression[left.object.property.name="style"]',
          message:
            'Use CSS classes, setCssStyles or setCssProps instead of direct style assignments.',
        },
      ],
    },
  },
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
);
