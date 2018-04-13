var portal = require('/lib/xp/portal');

exports.data = require('data.js').data;
exports.content = require('content.js').content;
exports.view = require('view.js').view;

exports.log = function (data) {
    log.info('STK log %s', JSON.stringify(data, null, 4));
};

exports.serviceUrl = function (service, params, application) {
    var url;
    if (params && application) {
        url = portal.serviceUrl({
            service: service,
            params: params,
            application: application
        });
    } else if (params) {
        url = portal.serviceUrl({
            service: service,
            params: params
        });
    } else if (application) {
        url = portal.serviceUrl({
            service: service,
            application: application
        });
    } else {
        url = portal.serviceUrl({
            service: service
        });
    }
    return url;
};