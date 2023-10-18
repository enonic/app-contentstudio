export interface Response {
    contentType?: string
    body?: string | Record<string, unknown>
    headers?: {
        'content-security-policy'?: string
    }
    status?: number
    webSocket?: {
        data: Record<string, unknown>
        subProtocols?: string[]
    }
}
