import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this /web subfolder — the repo also contains
    // a sibling root-level package.json (legacy Electron app), which Next.js
    // otherwise incorrectly infers as the workspace root due to the extra
    // lockfile at D:\Projects\package-lock.json.
    root: path.join(__dirname),
  },
};

export default nextConfig;
