const path = require("path");

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  output: "standalone",
  serverExternalPackages: ["pino", "pino-pretty"],

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = nextConfig;
