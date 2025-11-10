/*global __*/

var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
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
    for (var i = 0; i < styles.css.length; i++) {
        if (styles.css[i]) {
            cssUrls.push(portalLib.assetUrl({
                path: styles.css[i],
                application: styles.app[i]
            }));
        }
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
