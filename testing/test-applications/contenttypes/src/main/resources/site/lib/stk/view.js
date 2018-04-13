exports.view = {};
var thymeleaf = require('/lib/xp/thymeleaf');

// Render Thymeleaf view
exports.view.render = function (view, params) {
    return {
        body: thymeleaf.render(view, params)
    };
};