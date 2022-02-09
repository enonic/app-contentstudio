const mainJs = require('./../main/main');

function handleGet() {
    const params = mainJs.getParams();

    params.assetsUri = replaceSettingsInPath(params.assetsUri);

    return mainJs.renderTemplate(params);
}

function replaceSettingsInPath(url) {
    return url.replace('/settings/', '/main/');
}

exports.get = handleGet;
