/*global app, resolve*/

const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');

function handleGet(req) {
    const key = req.params.contentId;

    let content;
    if (key) {
        content = contentLib.get({key});
    } else {
        content = portalLib.getContent();
    }

    return {
        contentType: 'application/json',
        status: content ? 200 : 404,
        body: content
    };
}

exports.get = handleGet;
