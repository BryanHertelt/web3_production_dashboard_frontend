const path = require("path");

const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/data-table-test",
        permanent: false,
      },
    ];
  },

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
