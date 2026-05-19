import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
    default_popup: "src/popup/index.html",
  },
  permissions: ["contentSettings", "storage"],
  host_permissions: ["https://*/*"],
  content_scripts: [
    {
      js: ["src/content/views/inject.ts"],
      matches: ["https://*.jd.com/*", "https://mms.pinduoduo.com/*"],
      run_at: "document_start",
      world: "MAIN",
    },
    {
      js: ["src/content/index.tsx"],
      matches: ["https://*/*"],
      run_at: "document_start",
    },
  ],
  options_page: "src/options/index.html",
});
