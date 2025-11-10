import { NextRequest, NextResponse } from "next/server";
import { serverLogger } from "@/shared/logger/server-logger/model/logger";

/**
 * API Proxy Route Handler
 *
 * Proxies all client-side API requests to the appropriate backend server.
 * Conditionally adds Basic Authentication based on the ENVIRONMENT variable.
 *
 * Environment Configurations:
 * - local: Proxies to localhost:3001 (Mockoon) without authentication
 * - dev: Proxies to dev server with Basic Auth credentials
 *
 * @param request - The incoming Next.js request
 * @param params - Route parameters containing the catch-all path
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "PUT");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleProxyRequest(request, path, "DELETE");
}

/**
 * Handles the proxy request logic for all HTTP methods
 */
async function handleProxyRequest(
  request: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  try {
    // Get environment configuration
    const environment = process.env.ENVIRONMENT || "local";

    // Use PROXY_TARGET_URL if set, otherwise fall back to API_BASE_URL
    // This allows server-side requests to use API_BASE_URL (internal container)
    // while proxy uses PROXY_TARGET_URL (external URL with auth)
    const apiBaseUrl = process.env.PROXY_TARGET_URL || process.env.API_BASE_URL || "http://localhost:3001";

    // Construct the target URL
    const targetPath = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${apiBaseUrl}/${targetPath}${searchParams ? `?${searchParams}` : ""}`;

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add Basic Auth for dev environment
    if (environment === "dev") {
      const username = process.env.DEV_SERVER_USER;
      const password = process.env.DEV_SERVER_PASSWORD;

      if (!username || !password) {
        await serverLogger.error(
          "[Proxy] DEV_SERVER_USER or DEV_SERVER_PASSWORD not set in dev environment"
        );
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      // Create Basic Auth header
      const credentials = Buffer.from(`${username}:${password}`).toString(
        "base64"
      );
      headers["Authorization"] = `Basic ${credentials}`;
    }

    // Prepare request config
    const requestConfig: RequestInit = {
      method,
      headers,
    };

    // Add body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          requestConfig.body = body;
        }
      } catch (error) {
        await serverLogger.error("[Proxy] Error reading request body", {
          error: String(error),
        });
      }
    }

    // Make the proxied request
    const response = await fetch(targetUrl, requestConfig);

    // Get response data
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return the proxied response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (error) {
    await serverLogger.error("[Proxy] Error proxying request", {
      error: String(error),
      path: path.join("/"),
      method,
    });
    return NextResponse.json(
      { error: "Proxy request failed", details: String(error) },
      { status: 500 }
    );
  }
}
