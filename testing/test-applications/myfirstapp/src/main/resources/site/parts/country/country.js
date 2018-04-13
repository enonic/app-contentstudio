var portal = require('/lib/xp/portal'); // Import the portal functions
var thymeleaf = require('/lib/xp/thymeleaf'); // Import the Thymeleaf rendering function

// Handle the GET request
exports.get = function (req) {

    // Get the country content and extract the needed data from the JSON
    var content = portal.getContent();

    // Prepare the model object with the needed data extracted from the content
    var model = {
        name: content.displayName,
        description: content.data.description,
        population: content.data.population
    };

    // Specify the view file to use
    var view = resolve('country.html');

    // Return the merged view and model in the response object
    return {
        body: thymeleaf.render(view, model)
    }
};