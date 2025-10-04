module.exports = {
  ci: {
    collect: {
      url: ["http://web-app:3000"],
      settings: {
        // Chrome flags for Docker environment (headful mode for better rendering)
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
        // Maximum time to wait for page load (90 seconds)
        maxWaitForLoad: 90000,
      },
    },
    assert: {
      // Performance thresholds - adjust these based on your requirements
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports",
    },
    wizard: {
      // Disable the step by step guidance through process, since we are running in CI
      enabled: false,
    },
  },
};
