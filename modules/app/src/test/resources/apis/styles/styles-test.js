var assert = require('/lib/xp/testing');
var styleApi = require('/apis/styles/styles');

exports.testGetReturnsStyles = function () {
    var result = styleApi.GET({
        params: {
            contentId: 'content-id',
            project: 'default'
        },
        locales: ['en']
    });

    assert.assertEquals(200, result.status);
    assert.assertEquals('application/json', result.contentType);
    assert.assertJsonEquals({styles: [], css: []}, result.body);
};
