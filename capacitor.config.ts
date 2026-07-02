import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.statecities.app",
  appName: "State Cities",
  webDir: "dist",
  server: {
    // Match Android WebView secure context expectations.
    androidScheme: "https",
  },
};

export default config;
