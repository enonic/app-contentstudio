var lib = {
    httpClient: require('/lib/http-client'),
    portal: require('/lib/xp/portal'),
    content: require('/lib/xp/content')
};

var imageUrl;

exports.get = function(req) {

    if (!req.params.id) {
        throw Error('Image id is required to generate image preview url');
    }

    var useActualImage = req.params.actual && req.params.actual=='true';

    if (useActualImage) {
        imageUrl = getAttachmentUrl(req.params.id);
    }
    else {
        var width = req.params.width || getDefaultWidth(req.params.id);
        imageUrl = getImageUrl(req.params.id, width, req.params.scale);
    }

    var response = getImage(imageUrl);

    return {
        status: 200,
        contentType: response.contentType,
        body: response.bodyStream
    }
};

var getDefaultWidth = function(id) {
    var result = lib.content.get({
        key: id
    });

    if (result) {
        return result.x.media.imageInfo.imageWidth;
    }

    return 640; // Fallback width
};

var getAttachmentUrl = function(id) {
    return lib.portal.attachmentUrl({
        id: id,
        type: 'absolute'
    });
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

    return lib.httpClient.request({
        url: imageUrl,
        method: 'GET',
        auth: {
            user: 'su',
            password: 'password'
        }
    });
}
