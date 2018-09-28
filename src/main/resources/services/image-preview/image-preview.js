var lib = {
    httpClient: require('/lib/http-client'),
    portal: require('/lib/xp/portal'),
    auth: require('/lib/xp/auth'),
    context: require('/lib/xp/context')
};

var sudo = function(func) {
    return lib.context.run({
        user: "su",
        principals: ["role:system.admin"]
    }, func);
};

var imageUrl;

exports.get = function(req) {
    imageUrl = getImageUrl(req.params.id, req.params.width, req.params.scale);

    var login = lib.auth.login({
        user: 'su',
        password: 'password'
    });

    log.info(JSON.stringify(login, null, 4));

    var response = getImage();

    log.info(JSON.stringify(response, null, 4));
};

var getImage = function () {

    log.info(imageUrl);
    return lib.httpClient.request({
        url: imageUrl,
        method: 'GET',
        readTimeout: 5000,
        contentType: 'image/jpeg',
        auth: {
            user: 'su',
            password: 'password'
        }
    });
}

var getImageUrl = function(id, width, scale) {
    var scaleArr = scale.split(':');
    var height = parseInt(width * scaleArr[1] / scaleArr[0], 10);

    return lib.portal.imageUrl({
        id: id,
        scale: 'block(' + width + ',' + height + ')',
        type: 'absolute'
    });
};
