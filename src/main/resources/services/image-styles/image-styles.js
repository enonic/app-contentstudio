// Temporary service file that will be replaced by REST API in the XP core
// https://github.com/enonic/xp/issues/6619

var json = {
    "css": ["/styles/styles.css"],
    "styles": [{
        "name": "editor-style-raw",
        "type": "style",
        "displayName": "Unprocessed raw image"
    }, {
        "name": "editor-align-justify",
        "type": "alignment",
        "displayName": "Justify",
        "requires": {
            "name": "editor-width-auto",
            "displayName": "Auto (100%)"
        }
    }, {
        "name": "editor-align-left",
        "type": "alignment",
        "displayName": "Align Left",
        "requires": {
            "name": "editor-width-auto",
            "displayName": "Auto (40%)"
        }
    }, {
        "name": "editor-align-center",
        "type": "alignment",
        "displayName": "Center",
        "requires": {
            "name": "editor-width-auto",
            "displayName": "Auto (60%)"
        }
    }, {
        "name": "editor-align-right",
        "type": "alignment",
        "displayName": "Align Right",
        "requires": {
            "name": "editor-width-auto",
            "displayName": "Auto (40%)"
        }
    }, {
        "name": "editor-width-auto",
        "type": "width",
        "displayName": "Auto"
    }, {
        "name": "editor-width-actual",
        "type": "width",
        "displayName": "Actual"
    }, {
        "name": "editor-width-custom",
        "type": "width",
        "displayName": "Custom"
    }, {
        "name": "editor-style-cinema",
        "type": "style",
        "displayName": "Cinema",
        "params": {
            "scale": "21:9"
        }
    }]
};



exports.get = function(req) {

    return {
        status: 200,
        contentType: 'application/json',
        body: json
    }
};
