import type {RequestHeaders, RequestMethod, Response, ResponseBody} from '@enonic-types/core';
import libHttpClient, {HttpClientResponse} from '/lib/http-client';

export type RequestParams = {
    path: string;
    method?: RequestMethod;
    headers?: RequestHeaders;
    body?: unknown;
};

export function respondJson(status: number, body: ResponseBody): Response {
    return {
        status: status,
        contentType: 'application/json',
        body: body,
    };
}

export function respondMessage(status: number, message: string): Response {
    return respondJson(status, {
        message: message,
    });
}

export function request(params: RequestParams): HttpClientResponse {
    const path = params.path;
    const method = params.method || 'GET';
    const headers: RequestHeaders = {
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

export function getRequest(path: string, headers: RequestHeaders): HttpClientResponse {
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
