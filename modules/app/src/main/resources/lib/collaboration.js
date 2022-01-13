/* global __ */

function required(params, name) {
    const value = params[name];
    if (value === undefined) {
        throw `Parameter "${name}" is required`;
    }
    return value;
}

exports.join = function (params) {
    const bean = __.newBean('com.enonic.xp.app.contentstudio.CollaborationHandler');
    bean.setContentId(required(params, 'contentId'));
    bean.setSessionId(required(params, 'sessionId'));
    bean.setUserKey(required(params, 'userKey'));
    return __.toNativeObject(bean.join());
}

exports.left = function (params) {
    const bean = __.newBean('com.enonic.xp.app.contentstudio.CollaborationHandler');
    bean.setContentId(required(params, 'contentId'));
    bean.setSessionId(required(params, 'sessionId'));
    bean.setUserKey(required(params, 'userKey'));
    return __.toNativeObject(bean.left());
}
