import { serverRequest, get, post, put, patch, del } from '../../../shared/api-layer/server/api/request';
import { ServerApiError, TimeoutError, ServerDownError } from '../../../shared/api-layer/server/api/errors';
import { fetchWithTimeout } from '../../../shared/api-layer/server/config/fetch-config';

// Mock fetch globally
const fetchMock = jest.fn();
global.fetch = fetchMock;

// Mock the fetch-config module
jest.mock('../../../shared/api-layer/server/config/fetch-config', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_TIMEOUT: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  fetchWithTimeout: jest.fn(),
}));

const mockedFetchWithTimeout = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>;

// Helper function to create a proper mock Response
const createMockResponse = (overrides: Partial<Response> = {}): Response => {
  const defaults: Partial<Response> = {
    ok: true,
    status: 200,
    statusText: 'OK',
    redirected: false,
    type: 'basic',
    url: 'http://localhost:3001/test',
    headers: new Headers({ 'content-type': 'application/json' }),
    body: null,
    bodyUsed: false,
    json: jest.fn().mockResolvedValue({ data: 'test' }),
    text: jest.fn().mockResolvedValue(''),
    blob: jest.fn().mockResolvedValue(new Blob()),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    formData: jest.fn().mockResolvedValue(new FormData()),
    clone: jest.fn(),
  };

  return { ...defaults, ...overrides } as Response;
};

describe('serverRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('makes a successful GET request', async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({ data: 'test' }),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    const result = await serverRequest({
      url: '/test',
      method: 'GET',
    });

    expect(result).toEqual({ data: 'test' });
    expect(mockedFetchWithTimeout).toHaveBeenCalledWith(
      'http://localhost:3001/test',
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }),
      undefined
    );
  });

  it('makes a POST request with body', async () => {
    const mockResponse = createMockResponse({
      status: 201,
      json: jest.fn().mockResolvedValue({ id: 1 }),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    const body = { name: 'test' };
    const result = await serverRequest({
      url: '/test',
      method: 'POST',
      body,
    });

    expect(result).toEqual({ id: 1 });
    expect(mockedFetchWithTimeout).toHaveBeenCalledWith(
      'http://localhost:3001/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
      undefined
    );
  });

  it('handles non-JSON responses', async () => {
    const mockResponse = createMockResponse({
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: jest.fn().mockResolvedValue('plain text'),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    const result = await serverRequest({
      url: '/test',
      method: 'GET',
    });

    expect(result).toBe('plain text');
  });

  it('throws ServerApiError for non-2xx responses', async () => {
    const mockResponse = createMockResponse({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ message: 'Not found' }),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    await expect(serverRequest({
      url: '/test',
      method: 'GET',
    })).rejects.toThrow(ServerApiError);

    const error = await serverRequest({
      url: '/test',
      method: 'GET',
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServerApiError);
    expect((error as ServerApiError).status).toBe(404);
  });

  it('throws specific error types based on status', async () => {
    const testCases = [
      { status: 401, expectedError: 'UnauthorizedError' },
      { status: 403, expectedError: 'ForbiddenError' },
      { status: 429, expectedError: 'RateLimitError' },
    ];

    for (const { status, expectedError } of testCases) {
      const mockResponse = createMockResponse({
        ok: false,
        status,
        json: jest.fn().mockResolvedValue({ message: 'Error' }),
      });

      mockedFetchWithTimeout.mockResolvedValue(mockResponse);

      const error = await serverRequest({
        url: '/test',
        method: 'GET',
      }).catch((e: unknown) => e);

      expect((error as Error).constructor.name).toBe(expectedError);
    }
  });

  it('throws ServerApiError when URL is not provided', async () => {
    await expect(serverRequest({
      url: '',
      method: 'GET',
    })).rejects.toThrow(ServerApiError);
  });

  it('builds URL with query parameters', async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({}),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    await serverRequest({
      url: '/test',
      method: 'GET',
      query: { param1: 'value1', param2: 'value2' },
    });

    expect(mockedFetchWithTimeout).toHaveBeenCalledWith(
      'http://localhost:3001/test?param1=value1&param2=value2',
      expect.any(Object),
      undefined
    );
  });

  it('handles array query parameters', async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({}),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    await serverRequest({
      url: '/test',
      method: 'GET',
      query: { tags: ['tag1', 'tag2'] },
    });

    expect(mockedFetchWithTimeout).toHaveBeenCalledWith(
      'http://localhost:3001/test?tags=tag1&tags=tag2',
      expect.any(Object),
      undefined
    );
  });

  it('passes custom headers', async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({}),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    const customHeaders = { 'Authorization': 'Bearer token' };

    await serverRequest({
      url: '/test',
      method: 'GET',
      headers: customHeaders,
    });

    expect(mockedFetchWithTimeout).toHaveBeenCalledWith(
      'http://localhost:3001/test',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders,
        },
      }),
      undefined
    );
  });

  it('passes Next.js config when provided', async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({}),
    });

    mockedFetchWithTimeout.mockResolvedValue(mockResponse);

    const nextConfig = { revalidate: 60, tags: ['test'] };

    await serverRequest({
      url: '/test',
      method: 'GET',
      revalidate: 60,
      tags: ['test'],
    });

    expect(mockedFetchWithTimeout).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      nextConfig
    );
  });
});

describe('Convenience methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchWithTimeout.mockResolvedValue(createMockResponse({
      json: jest.fn().mockResolvedValue({ data: 'success' }),
    }));
  });

  it('get method calls serverRequest with GET method', async () => {
    const result = await get('/test', { param: 'value' });
    expect(result).toEqual({ data: 'success' });
  });

  it('post method calls serverRequest with POST method', async () => {
    const body = { name: 'test' };
    const result = await post('/test', body);
    expect(result).toEqual({ data: 'success' });
  });

  it('put method calls serverRequest with PUT method', async () => {
    const body = { name: 'test' };
    const result = await put('/test', body);
    expect(result).toEqual({ data: 'success' });
  });

  it('patch method calls serverRequest with PATCH method', async () => {
    const body = { name: 'test' };
    const result = await patch('/test', body);
    expect(result).toEqual({ data: 'success' });
  });

  it('del method calls serverRequest with DELETE method', async () => {
    const result = await del('/test');
    expect(result).toEqual({ data: 'success' });
  });
});

describe('Error handling', () => {
  it('handles network errors', async () => {
    mockedFetchWithTimeout.mockRejectedValue(new TypeError('fetch failed'));

    await expect(serverRequest({
      url: '/test',
      method: 'GET',
    })).rejects.toThrow(ServerDownError);
  });

  it('handles timeout errors', async () => {
    const abortError = new Error('Request timeout');
    abortError.name = 'AbortError';
    mockedFetchWithTimeout.mockRejectedValue(abortError);

    await expect(serverRequest({
      url: '/test',
      method: 'GET',
    })).rejects.toThrow(TimeoutError);
  });

  it('handles unknown errors', async () => {
    mockedFetchWithTimeout.mockRejectedValue(new Error('Unknown error'));

    await expect(serverRequest({
      url: '/test',
      method: 'GET',
    })).rejects.toThrow(ServerApiError);
  });
});