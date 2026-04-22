const router = require('/lib/router')();

exports.all = function (req) {
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
