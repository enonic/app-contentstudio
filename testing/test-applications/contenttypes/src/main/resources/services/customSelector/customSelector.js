var portalLib = require('/lib/xp/portal');
var helper = require('/lib/custom-selector-helper');

function handleGet(req) {

    var params = helper.parseparams(req.params);

    var body = helper.createresults(getItems(), params);

    return {
        contentType: 'application/json',
        body: body
    }
}

exports.get = handleGet;

function getItems() {
    return [{
        id: 1,
        displayName: "Option number 1",
        description: "External SVG file is used as icon",
        iconUrl: portalLib.assetUrl({path: 'images/number_1.svg'}),
        icon: null
    }, {
        id: 2,
        displayName: "Option number 2",
        description: "Inline SVG markup is used as icon",
        iconUrl: null,
        icon: {
            data: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path fill="#000" d="M16 3c-7.18 0-13 5.82-13 13s5.82 13 13 13 13-5.82 13-13-5.82-13-13-13zM16 27c-6.075 0-11-4.925-11-11s4.925-11 11-11 11 4.925 11 11-4.925 11-11 11zM17.564 17.777c0.607-0.556 1.027-0.982 1.26-1.278 0.351-0.447 0.607-0.875 0.77-1.282 0.161-0.408 0.242-0.838 0.242-1.289 0-0.793-0.283-1.457-0.848-1.99s-1.342-0.8-2.331-0.8c-0.902 0-1.654 0.23-2.256 0.69s-0.96 1.218-1.073 2.275l1.914 0.191c0.036-0.56 0.173-0.96 0.41-1.201s0.555-0.361 0.956-0.361c0.405 0 0.723 0.115 0.952 0.345 0.23 0.23 0.346 0.56 0.346 0.988 0 0.387-0.133 0.779-0.396 1.176-0.195 0.287-0.727 0.834-1.592 1.64-1.076 0.998-1.796 1.799-2.16 2.403s-0.584 1.242-0.656 1.917h6.734v-1.781h-3.819c0.101-0.173 0.231-0.351 0.394-0.534 0.16-0.183 0.545-0.552 1.153-1.109z"></path></svg>',
            type: "image/svg+xml"
        }
    }];
}