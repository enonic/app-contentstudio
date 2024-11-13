/*global app, resolve*/

const bean = __.newBean("com.enonic.xp.app.contentstudio.widget.AutomaticPreviewBean");

function handleGet(req) {
    // Add automatic flag to the request parameters for other widgets
    // to know if they were called directly or not
    req.params.auto = true;
    return __.toNativeObject(bean.renderByInterface('contentstudio.liveview'));
}

exports.get = handleGet;
