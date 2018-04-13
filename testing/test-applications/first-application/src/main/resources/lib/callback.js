exports.handle = function (key, value) {
    var bean = __.newBean('com.enonic.app.auth0.impl.CallbackScriptBean');
    return bean.handle();
};