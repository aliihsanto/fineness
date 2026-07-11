import type { NextConfig } from "next";

import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@fineness/scoring", "@fineness/db"],
  serverExternalPackages: ["postgres"],
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
};

export default nextConfig;
