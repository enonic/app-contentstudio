var lib = {
    httpClient: require('/lib/http-client'),
    portal: require('/lib/xp/portal')
};

var imageUrl;

exports.get = function(req) {
    log.info(JSON.stringify(req, null, 4));
    imageUrl = getImageUrl(req.params.id, req.params.width, req.params.scale);

    var response = getImage(imageUrl);

    log.info(JSON.stringify(response, null, 4));

    return {
        status: 200,
        contentType: response.contentType,
        body: response.bodyStream
    }
};

var getImageUrl = function(id, width, scale) {
    var scaleParam = 'width(' + width + ')';
    if (scale) {
        var scaleArr = scale.split(':');
        var height = parseInt(width * scaleArr[1] / scaleArr[0], 10);

        scaleParam = 'block(' + width + ',' + height + ')';
    }

    return lib.portal.imageUrl({
        id: id,
        scale: scaleParam,
        type: 'absolute'
    });
};

var getImage = function (imageUrl) {

    log.info(imageUrl);
    return lib.httpClient.request({
        url: imageUrl,
        method: 'GET',
        //contentType: 'image/jpeg',
        auth: {
            user: 'su',
            password: 'password'
        }
    });
}
