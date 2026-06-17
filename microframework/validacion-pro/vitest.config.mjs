export default {
  test: {
    include: ['tests/**/*.test.mjs'],
    coverage: {
      include: ['src/**/*.mjs'],
      reporter: ['text', 'html']
    }
  }
};
