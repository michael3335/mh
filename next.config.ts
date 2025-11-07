import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
};

export default withBotId(nextConfig);
