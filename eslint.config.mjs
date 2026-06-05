import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/Auth.tsx",
    "src/components/Dashboard.tsx",
    "src/components/NotificationCenter.tsx",
    "src/components/ResultCard.tsx",
    "src/components/Scanner.tsx",
    "src/components/SettingsTab.tsx",
    "src/components/TabBar.tsx",
    "src/config/**",
    "src/lib/logger.ts",
    "src/lib/nutrition/**",
    "src/lib/offline/**",
    "src/lib/openai.ts",
    "src/lib/rateLimiter.ts",
    "src/lib/supabase.ts",
  ]),
]);

export default eslintConfig;
