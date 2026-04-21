/*global __*/

var adminLib = require('/lib/xp/admin');

exports.GET = function (req) {
    var contentId = req.params.contentId;
    var project = req.params.project || 'default';
    if (!contentId) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: contentId'
        };
    }

    var styles = getStyles(contentId, project, req.locales);
    var cssUrls = [];

    var extBaseUrl = adminLib.extensionUrl({
        application: 'com.enonic.app.contentstudio',
        extension: 'style',
    });

    for (var i = 0; i < styles.app.length; i++) {
        cssUrls.push(`${extBaseUrl}/${styles.app[i]}/editor.css`);
    }

    styles.css = cssUrls;
    delete styles.app;

    return {
        status: 200,
        contentType: 'application/json',
        body: styles
    };
};

var getStyles = function (contentId, project, locales) {
    var bean = __.newBean('com.enonic.app.contentstudio.style.StyleHandler');
    bean.contentId = __.nullOrValue(contentId);
    bean.project = __.nullOrValue(project);
    bean.locales = __.nullOrValue(locales);
    return __.toNativeObject(bean.getStyles());
};
