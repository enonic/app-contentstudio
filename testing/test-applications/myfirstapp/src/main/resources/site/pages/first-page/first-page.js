var thymeleaf = require('/lib/xp/thymeleaf'); // Import the thymeleaf render function

// Handle the GET request
exports.get = function (req) {

    // Specify the view file to use
    var view = resolve('first-page.html');

    // Render HTML from the view file
    var body = thymeleaf.render(view, {});

    // Return the response object
    return {
        body: body
    }
};