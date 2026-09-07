import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    node: 'src/node.ts',
    react: 'src/react.ts',
    next: 'src/next.ts',
    schema: 'src/schema/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: { resolve: true },
  clean: true,
  sourcemap: true,
  splitting: false,
  // @t3-oss/env-core and @t3-oss/env-nextjs ship ESM-only, so they can't be
  // `require()`-d from the CJS build. Bundle them (and zod) in so apps only
  // ever depend on "@repo/env" - both at runtime and for type-checking.
  noExternal: ['@t3-oss/env-core', '@t3-oss/env-nextjs', 'zod'],
});
