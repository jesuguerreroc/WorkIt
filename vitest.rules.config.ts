import { defineConfig } from 'vitest/config'

// Security Rules tests. They need the Firestore emulator, so run them with
// `npm run test:rules` (which starts it) rather than plain `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20_000,
    fileParallelism: false,
  },
})
