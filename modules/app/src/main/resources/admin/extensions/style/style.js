exports.GET = function (req) {
    const match = req.path.match(/\/([^/]+)\/editor\.css/);
    if (!match) {
        return {
            status: 404,
            contentType: 'text/plain',
            body: 'Not found'
        };
    }

    const bean = __.newBean('com.enonic.app.main.GetStyleBean');
    bean.setApplication(match[1]);
    const css = bean.execute();

    return {
        contentType: 'text/css; charset=utf-8',
        body: css,
    };
};
