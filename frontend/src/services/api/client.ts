export class ApiError extends Error {
  public status: number
  public code: string
  public details?: any

  constructor(status: number, message: string, code: string = 'API_ERROR', details?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl
  }
  return 'http://localhost:8000/api/v1'
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
  params?: Record<string, string | number | boolean | undefined | null>
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getBaseUrl()
  }

  private buildUrl(endpoint: string, rawParams?: Record<string, any>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`)

    // Support both direct params { policy_id: '123' } and nested params { params: { policy_id: '123' } }
    const actualParams =
      rawParams && typeof rawParams === 'object' && 'params' in rawParams && typeof rawParams.params === 'object' && rawParams.params !== null
        ? { ...rawParams.params, ...rawParams }
        : rawParams

    if (actualParams) {
      Object.entries(actualParams).forEach(([key, value]) => {
        if (key !== 'params' && value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeoutMs = 15000, params, ...fetchOptions } = options
    const url = this.buildUrl(endpoint, params)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 204) {
        return {} as T
      }

      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      if (!response.ok) {
        let code = 'HTTP_ERROR'
        let message = `Request failed with status ${response.status}`
        let details = null

        if (data && typeof data === 'object') {
          if (data.error) {
            code = data.error.code || code
            message = data.error.message || message
            details = data.error.details
          } else if (data.detail) {
            message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
          }
        }

        throw new ApiError(response.status, message, code, details)
      }

      return data as T
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request timed out after ' + timeoutMs + 'ms', 'TIMEOUT_ERROR')
      }
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        0,
        error.message || 'Unable to connect to RiskFire API server',
        'NETWORK_ERROR'
      )
    }
  }

  get<T>(endpoint: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params })
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
