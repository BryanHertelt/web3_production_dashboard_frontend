module.exports = {
  ci: {
    collect: {
      // URL configurations for both mobile and desktop testing
      url: [
        {
          url: "http://web-app:3000",
          label: "mobile",
        },
        {
          url: "http://web-app:3000",
          label: "desktop",
          settings: {
            formFactor: "desktop",
            screenEmulation: {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
            },
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
            },
          },
        },
      ],
      settings: {
        // Use headless Chrome
        chromeFlags: "--no-sandbox --disable-dev-shm-usage --headless",
        // Wait for network to have at most two connections left for 500 ms
        waitUntil: "networkidle2",
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
