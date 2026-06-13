const router = require('/lib/router')();
const portalLib = require('/lib/xp/portal');

exports.all = function (req) {
    // Fetch-only CSS endpoint: lock down so a direct browser navigation to it is inert.
    portalLib.csp().strict();
    return router.dispatch(req);
};

router.get('/{appName:[^/]+}/editor.css', (req) => {
    const bean = __.newBean('com.enonic.app.main.GetStyleBean');
    bean.setApplication(req.pathParams.appName);
    const css = bean.execute();

    return {
        contentType: 'text/css; charset=utf-8',
        body: css,
    };
});
