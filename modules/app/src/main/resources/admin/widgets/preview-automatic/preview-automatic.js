/*global app, resolve*/

const bean = __.newBean("com.enonic.xp.app.contentstudio.widget.AutomaticPreviewBean");

function handleGet(req) {
    return __.toNativeObject(bean.renderByInterface('contentstudio.preview'));
}

exports.get = handleGet;
