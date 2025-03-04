declare global {
    interface XpLibraries {
        '/lib/http-client': typeof import('./httpClient');
    }
}

declare const __brand: unique symbol;

export type Stream = object & {[__brand]: 'Stream'};

export type ContentType = LiteralUnion<
    'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data'
>;

export interface HttpClientRequestOptions {
    url: string;
    method?: HttpMethod;
    queryParams?: Record<string, string | number>;
    params?: Record<string, string>;
    headers?: Enonic.RequestHeaders;
    disableHttps2?: boolean; // false
    connectionTimeout?: number; // 10000
    readTimeout?: number; // 10000
    disableHttp2?: boolean; // false
    body?: string | Stream;
    contentType?: ContentType;
    followRedirects?: boolean;
    multipart?: {
        name: string;
        value: string | Stream;
        fileName?: string;
        contentType?: ContentType;
    }[];
    auth?: {
        user: string;
        password: string;
    };
    proxy?: {
        host: string;
        port: number;
        user: string;
        password: string;
    };
    certificates?: Stream;
    clientCertificate?: Stream;
}

export interface HttpClientResponse {
    status: number;
    message: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    contentType: string;
    body: string | null;
    bodyStream?: Stream;
}

export interface HttpClient {
    request: (params: HttpClientRequestOptions) => HttpClientResponse;
}

declare const httpClient: HttpClient;

export default httpClient;
