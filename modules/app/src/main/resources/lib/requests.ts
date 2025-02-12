import libHttpClient from '/lib/http-client';

export type RequestParams = {
    path: string;
    method?: Enonic.HttpMethod;
    headers?: Enonic.RequestHeaders;
    body?: unknown;
};

export function respondJson(status: number, body: unknown) {
    return {
        status: status,
        contentType: 'application/json',
        body: body,
    };
}

export function respondMessage(status: number, message: string) {
    return respondJson(status, {
        message: message,
    });
}

export function request(params: RequestParams): Enonic.Response {
    const path = params.path;
    const method = params.method || 'GET';
    const headers: Enonic.RequestHeaders = {
        accept: 'application/json',
        ...(params.headers || {}),
    };
    const body = params.body;

    return libHttpClient.request({
        url: path,
        method: method,
        headers: headers,
        connectionTimeout: 15000,
        readTimeout: 10000,
        body: body ? JSON.stringify(body) : undefined,
    });
}

export function getRequest(path: string, headers: Enonic.RequestHeaders): Enonic.Response {
    try {
        return libHttpClient.request({
            url: path,
            method: 'GET',
            headers: headers || {},
        });
    } catch (err) {
        log.error('Problems with executing GET: ' + path);
        log.error(err);
        throw err;
    }
}
