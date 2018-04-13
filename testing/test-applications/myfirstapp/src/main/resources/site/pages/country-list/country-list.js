var thymeleaf = require('/lib/xp/thymeleaf'); // Import the thymeleaf render function
var contentLib = require('/lib/xp/content'); // Import the content service functions
var portal = require('/lib/xp/portal'); // Import the portal functions

// Handle the GET request
exports.get = function (req) {
    var model = {};

    // Get all the country contents
    var result = contentLib.query({
        start: 0,
        count: 100,
        contentTypes: [
            app.name + ':country'
        ]
    });

    var hits = result.hits;
    var countries = [];

    // Loop through the contents and extract the needed data
    for (var i = 0; i < hits.length; i++) {

        var country = {};
        country.name = hits[i].displayName;
        country.contentUrl = portal.pageUrl({
            id: hits[i]._id
        });
        countries.push(country);
    }

    // Add the country data to the model
    model.countries = countries;

    // Specify the view file to use
    var view = resolve('country-list.html');

    // Compile HTML from the view with dynamic data from the model
    var body = thymeleaf.render(view, model);

    // Return the response object
    return {
        body: body
    }
};