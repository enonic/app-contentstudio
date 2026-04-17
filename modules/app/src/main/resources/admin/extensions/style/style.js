exports.get = function (req) {
    const match = req.path.match(/com.enonic.app.contentstudio:style\/([^/]+)\/editor\.css/);
    if (!match) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Invalid path'
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
