"use client";
import React, { useState } from "react";
import {
  get,
  post,
  put,
  patch,
  del,
  ServerApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  NotFoundError,
  ServerDownError,
  RateLimitError,
  UnauthorizedError,
  ForbiddenError,
  API_BASE_URL,
  API_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY,
} from "@/shared/api-layer/server";

/**
 * API Test Page Component
 * Provides a visual interface to test the server-side API layer functionality.
 * Allows triggering various HTTP requests, displaying responses, errors, and configurations.
 */
export default function ApiTestPage() {
  const [url, setUrl] = useState("/test");
  const [query, setQuery] = useState("{}");
  const [body, setBody] = useState("{}");
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<
    "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  >("GET");

  const handleRequest = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      let parsedQuery: Record<string, unknown> | undefined;
      let parsedBody: unknown | undefined;

      try {
        parsedQuery = query ? JSON.parse(query) : undefined;
      } catch {
        throw new Error("Invalid JSON in query parameters");
      }

      try {
        parsedBody = body && method !== "GET" ? JSON.parse(body) : undefined;
      } catch {
        throw new Error("Invalid JSON in request body");
      }

      let result: unknown;

      switch (method) {
        case "GET":
          result = await get(url, parsedQuery);
          break;
        case "POST":
          result = await post(url, parsedBody);
          break;
        case "PUT":
          result = await put(url, parsedBody);
          break;
        case "PATCH":
          result = await patch(url, parsedBody);
          break;
        case "DELETE":
          result = await del(url);
          break;
      }

      setResponse(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      let errorMessage = "Unknown error";
      if (err instanceof ServerApiError) {
        errorMessage = `${err.name}: ${err.message} (Status: ${err.status}, Code: ${err.code})`;
      } else if (err instanceof Error) {
        errorMessage = `${err.name}: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Server API Layer Test Page
        </h1>

        {/* Configuration Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Base URL:</strong> {API_BASE_URL}
            </div>
            <div>
              <strong>Timeout:</strong> {API_TIMEOUT}ms
            </div>
            <div>
              <strong>Max Retries:</strong> {MAX_RETRIES}
            </div>
            <div>
              <strong>Retry Delay:</strong> {RETRY_DELAY}ms
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Make a Request</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                HTTP Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Endpoint URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/test"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Query Parameters (JSON)
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full p-2 border border-gray-300 rounded-md h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Request Body (JSON)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"data": "value"}'
                className="w-full p-2 border border-gray-300 rounded-md h-20"
                disabled={method === "GET"}
              />
            </div>
          </div>
          <button
            onClick={handleRequest}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Request"}
          </button>
        </div>

        {/* Response Display */}
        {response && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-green-600">
              Response
            </h2>
            <pre className="bg-green-50 p-4 rounded-md overflow-x-auto text-sm">
              {response}
            </pre>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
            <div className="bg-red-50 p-4 rounded-md text-sm text-red-800">
              {error}
            </div>
          </div>
        )}

        {/* Test Scenarios */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setMethod("GET");
                setUrl("/nonexistent");
                setQuery("{}");
                setBody("{}");
              }}
              className="p-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
            >
              Test 404 Not Found
            </button>
            <button
              onClick={() => {
                setMethod("POST");
                setUrl("/test");
                setQuery("{}");
                setBody('{"test": "data"}');
              }}
              className="p-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
            >
              Test POST Request
            </button>
            <button
              onClick={() => {
                setMethod("GET");
                setUrl("/timeout-test");
                setQuery("{}");
                setBody("{}");
              }}
              className="p-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200"
            >
              Test Timeout (if endpoint exists)
            </button>
            <button
              onClick={() => {
                setMethod("GET");
                setUrl("/invalid-url");
                setQuery("{}");
                setBody("{}");
              }}
              className="p-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            >
              Test Network Error
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
