var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    var contentId = req.params.contentId;
    if (!contentId) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: contentId'
        }
    }
    var layer = req.params.layer;
    if (!layer) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: layer'
        }
    }

    var styles = getStyles(contentId, layer);
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

var getStyles = function (contentId, layer) {
    var bean = __.newBean('com.enonic.xp.app.contentstudio.style.StyleHandler');
    bean.contentId = __.nullOrValue(contentId);
    bean.layer = __.nullOrValue(layer);
    return __.toNativeObject(bean.getStyles());
};