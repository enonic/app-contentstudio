var exportLib = require('/lib/export/export');

exports.get = function (req) {
    const type = req.params.type;
    const report = exportLib.generateExport(req.params);

    return {
        contentType: `text/${type}`,
        status: report ? 200 : 404,
        body: report ? report : 'Not found'
    };
};
