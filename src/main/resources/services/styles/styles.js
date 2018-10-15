var portalLib = require('/lib/xp/portal');

exports.post = function (req) {
    var contentId = req.params.contentId;
    if (!contentId) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: contentId'
        }
    }

    var styles = getStyles(contentId);
    for (var i = 0; i < styles.css.length; i++) {
        styles.css[i] = portalLib.assetUrl({
            path: styles.css[i],
            application: styles.app[i]
        });
    }
    delete styles.app;

    return {
        status: 200,
        contentType: 'application/json',
        body: styles
    }
};

var getStyles = function (contentId) {
    var bean = __.newBean('com.enonic.xp.app.contentstudio.style.StyleHandler');
    bean.contentId = __.nullOrValue(contentId);
    return __.toNativeObject(bean.getStyles());
};