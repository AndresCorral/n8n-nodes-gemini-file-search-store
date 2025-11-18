// Minimal ESLint flat config to satisfy ESLint v9 requirements
// This keeps lint runnable via @n8n/node-cli without introducing extra dependencies
export default [
  {
    ignores: ['dist/**']
  }
];