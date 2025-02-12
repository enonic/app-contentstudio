namespace Enonic {
    type DefaultResponseHeaders = {
        'content-type'?: string;
        'cache-control'?: string;
        'content-security-policy'?: string;
    } & Record<string, string>;

    type ResponseBody = string | Record<string, unknown> | unknown[];

    interface Response<Body = ResponseBody, Headers extends Record<string, string> = DefaultResponseHeaders> {
        applyFilters?: boolean;
        body?: Body;
        contentType?: string;
        cookies?: Record<string, string>;
        headers?: Headers;
        postProcess?: boolean;
        redirect?: string;
        status?: number;
        webSocket?: {
            data?: Record<string, unknown>;
            subProtocols?: string[];
        };
    }
}
