/**
 * API route handler for forwarding application logs to Grafana Loki.
 *
 * This handler accepts log entries from the frontend, formats them according to
 * Loki's push API specification, and forwards them to a Grafana Loki instance.
 * Logs are organized into multiple streams based on their severity level.
 *
 * @module LoggingRoute
 */

/**
 * Handles POST requests to push logs to Grafana Loki.
 *
 * The handler processes incoming log data, converts it to Loki's format with
 * nanosecond timestamps, and creates multiple log streams:
 * - A general stream (`zenet_web_frontend`) containing all logs
 * - Level-specific streams for each log level (debug, info, warn, error, fatal)
 *
 * Authentication is performed using Basic Auth with credentials from environment
 * variables (API_USERNAME and API_KEY_LOKI).
 *
 * @async
 * @function POST
 * @param {Request} req - The incoming HTTP request object containing the log data
 * @param {Object} req.body - Expected JSON body with log information
 * @param {string} [req.body.level='info'] - Log level (debug, info, warn, error, fatal)
 * @param {*} req.body.* - Any additional log data to be serialized
 *
 * @returns {Promise<Response>} HTTP response object
 * @returns {Response} 200 - Successfully sent log to Loki
 * @returns {Response} 400 - Invalid JSON in request body
 * @returns {Response} 500 - Failed to send to Loki or internal server error
 *
 * @throws {Error} If there's an error reading the request body or communicating with Loki
 *
 * @example
 * // Client-side usage:
 * fetch('/api/logs', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     level: 'error',
 *     message: 'Something went wrong',
 *     userId: '12345'
 *   })
 * });
 */
export async function POST(req) {
  const lokiUrl = "https://logs-prod-021.grafana.net/loki/api/v1/push";
  try {
    // Read and parse the incoming request body
    const bodyText = await req.text();

    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr.message);
      return new Response("Invalid JSON body", { status: 400 });
    }

    // Extract log level (default to 'info') and create nanosecond timestamp
    const logLevel = body.level || "info";
    const timestamp = `${BigInt(Date.now()) * 1_000_000n}`;
    const logValue = [timestamp, JSON.stringify(body)];

    /**
     * Array of log streams to be sent to Loki.
     * Each stream has labels (app, level) and an array of [timestamp, value] tuples.
     * @type {Array<{stream: Object, values: Array<Array<string>>}>}
     */
    const streams = [
      // General stream for aggregate graphic (all logs)
      {
        stream: {
          app: "zenet_web_frontend",
        },
        values: [logValue],
      },
    ];

    // Only add level-specific stream for Debug level
    if (logLevel === "debug") {
      streams.push({
        stream: {
          app: "zenet_web_frontend_debug",
          level: "debug",
        },
        values: [logValue],
      });
    }

    // Only add level-specific stream for Info level
    if (logLevel === "info") {
      streams.push({
        stream: {
          app: "zenet_web_frontend_info",
          level: "info",
        },
        values: [logValue],
      });
    }

    // Only add level-specific stream for Warn level
    if (logLevel === "warn") {
      streams.push({
        stream: {
          app: "zenet_web_frontend_warn",
          level: "warn",
        },
        values: [logValue],
      });
    }

    // Only add level-specific stream for Error level
    if (logLevel === "error") {
      streams.push({
        stream: {
          app: "zenet_web_frontend_error",
          level: "error",
        },
        values: [logValue],
      });
    }

    // Only add level-specific stream for Fatal level
    if (logLevel === "fatal") {
      streams.push({
        stream: {
          app: "zenet_web_frontend_fatal",
          level: "fatal",
        },
        values: [logValue],
      });
    }

    /**
     * Loki push API payload containing the streams array.
     * @type {{streams: Array}}
     */
    const logLine = {
      streams,
    };

const API_USERNAME = process.env.API_USERNAME;
const API_KEY_LOKI = process.env.API_KEY_LOKI;

if (!API_USERNAME || !API_KEY_LOKI) {
throw new Error(
"Missing required environment variables: API_USERNAME and/or API_KEY_LOKI"
);
}

    // Send the formatted log data to Grafana Loki
    const res = await fetch(lokiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.API_USERNAME}:${process.env.API_KEY_LOKI}`).toString("base64")}`,
      },
      body: JSON.stringify(logLine),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Loki push failed:", errorText);
      return new Response("Failed to send to Loki", { status: 500 });
    }

    return new Response("Log sent to Loki", { status: 200 });
  } catch (err) {
    console.error("Logging route error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
