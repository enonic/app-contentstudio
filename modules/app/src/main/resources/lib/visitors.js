/* global __ */

function required(params, name) {
    const value = params[name];
    if (value === undefined) {
        throw `Parameter "${name}" is required`;
    }
    return value;
}

exports.open = function (params) {
    const bean = __.newBean('com.enonic.xp.app.contentstudio.OpenContentHandler');
    bean.setContentId(required(params, 'contentId'));
    bean.setSessionId(required(params, 'sessionId'));
    bean.setUserKey(required(params, 'userKey'));
    return __.toNativeObject(bean.execute());
}

exports.close = function (params) {
    const bean = __.newBean('com.enonic.xp.app.contentstudio.CloseContentHandler');
    bean.setContentId(required(params, 'contentId'));
    bean.setSessionId(required(params, 'sessionId'));
    bean.setUserKey(required(params, 'userKey'));
    return __.toNativeObject(bean.execute());
}
