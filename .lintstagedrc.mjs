export default {
  "*.{ts,tsx,mts}": ["eslint --fix --max-warnings=0 --no-warn-ignored", "prettier --write"],
  "*.{js,mjs,cjs,json,css,md,yml,yaml}": ["prettier --write"],
  // `prisma format` works on the whole schema, so don't pass it file names.
  "packages/db/prisma/schema.prisma": () => "pnpm --filter @ecom/db exec prisma format",
};
