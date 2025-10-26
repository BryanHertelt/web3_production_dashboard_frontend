const path = require("path");

module.exports = {
  outputFileTracingRoot: path.join(__dirname),
  output: "standalone",
  serverExternalPackages: ["pino", "pino-pretty"],
};
