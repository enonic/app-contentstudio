const utils = require('/lib/utils');
const libHttpClient = require('/lib/http-client');

function respondJson(status, body) {
    return {
        status: status,
        contentType: 'application/json',
        body: body,
    };
}

exports.respondJson = respondJson;

function respondMessage(status, message) {
    return respondJson(status, {
        message: message,
    });
}

exports.respondMessage = respondMessage;

function request(params) {
    const path = params.path;
    const method = params.method || 'GET';
    const headers = utils.copy({
        accept: 'application/json',
    }, params.headers || {});
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

exports.request = request;

function getRequest(path, headers) {
    try {
        return libHttpClient.request({
            url: path,
            method: 'GET',
            headers: headers || {},
        });
    } catch (e) {
        log.error('Problems with executing GET: ' + path);
        log.error(e.stack);
        throw e;
    }
}

exports.getRequest = getRequest;
