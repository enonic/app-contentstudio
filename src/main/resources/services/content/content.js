var contentLib = require('/lib/xp/content');

exports.get = function (req) {
    var contentId = req.params.contentId;
    if (!contentId) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: contentId'
        }
    }

    return {
        status: 200,
        contentType: 'application/json',
        body: getContentByIdAndVersion(contentId, req.params.versionId)
    }
};

var getContentByIdAndVersion = function (contentId, versionId) {

    return contentLib.get({
        key: contentId,
        versionId: versionId
    });
};
