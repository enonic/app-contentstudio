export type StringObject = Record<string, string>;

export interface DefaultHeaders extends StringObject {
    accept?: string
    'accept-charset'?: string
    'accept-encoding'?: string
    authorization?: string
    cookies?: string
    'if-none-match'?: string
    language?: string
    'user-agent'?: string
}

export type Method = 'GET'|'POST'|'HEAD'|'PUT'|'DELETE'|'PATCH'

export type Mode = 'edit'|'inline'|'live'|'preview'

export type Request<
    Body = string,
    Cookies extends StringObject = StringObject,
    Headers extends StringObject = DefaultHeaders,
    Params extends StringObject = StringObject,
    PathParams extends StringObject = StringObject
> = {
    body?: Body
    branch?: string
    contextPath?: string
    cookies?: Cookies
    headers?: Headers
    host?: string
    method?: Method
    mode?: Mode
    params?: Params
    path?: string
    pathParams?: PathParams
    port?: string|number
    rawPath?: string
    remoteAddress?: string
    scheme?: string
    url?: string
    webSocket?: unknown // TODO
} // Request
