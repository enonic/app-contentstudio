var exportLib = require('/lib/export/export');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    // Fetch-only API: lock down so a direct browser navigation to this endpoint is inert.
    portalLib.csp().strict();
    const type = req.params.type;
    const report = exportLib.generateExport(req.params);

    return {
        contentType: `text/${type}`,
        status: report ? 200 : 404,
        headers: {
            'Cache-Control': 'no-store',
        },
        body: report ? report : 'Not found'
    };
};
