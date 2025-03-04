namespace Enonic {
    type RequestHeaders = {
        accept?: string;
        'accept-charset'?: string;
        'accept-encoding'?: string;
        authorization?: string;
        'content-length'?: string;
        'content-type'?: string;
        cookies?: string;
        expect?: string;
        host?: string;
        'if-none-match'?: string;
        language?: string;
        'sec-websocket-protocol'?: string;
        'user-agent'?: string;
    } & Record<string, string | undefined>;

    type HttpMethod = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE' | 'PATCH';

    interface Request<
        Body = string,
        Headers extends Record<string, string> = RequestHeaders,
        Params extends Record<string, string> = Record<string, string>,
        Cookies extends Record<string, string> = Record<string, string>,
        PathParams extends Record<string, string> = Record<string, string>,
    > {
        [key: string]: unknown;
        body?: Body;
        branch?: string;
        contextPath?: string;
        cookies?: Cookies;
        headers?: Headers;
        host?: string;
        method?: HttpMethod;
        mode?: 'edit' | 'inline' | 'live' | 'preview' | 'admin';
        webSocket?: boolean;
        params?: Params;
        path?: string;
        pathParams?: PathParams;
        port?: string | number;
        rawPath?: string;
        remoteAddress?: string;
        scheme?: string;
        url?: string;
    }
}
