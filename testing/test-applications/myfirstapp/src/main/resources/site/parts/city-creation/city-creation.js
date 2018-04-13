var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/xp/thymeleaf');
var contentSvc = require('/lib/xp/content');

var view = resolve('city-creation.page.html');
var service = require('service.js').service;

function handleGet(req) {
    var cityServiceUrl = service.serviceUrl('city');
    var content = portal.getContent();

    var cityName;
    var cityLocation;
    var cityPopulation;
    if (req.params.city) {
        var city = getCity(req.params.city);
        if (city) {
            cityName = city.displayName;
            cityLocation = city.data.cityLocation;
            cityPopulation = city.data.cityPopulation;
        }
    }

    cityName = cityName || "City Name";
    cityLocation = cityLocation || "lat,lon";
    cityPopulation = cityPopulation || "7000";

    var params = {
        cityServiceUrl: cityServiceUrl,
        parentPath: content._path,
        defaultCityName: cityName,
        defaultCityLocation: cityLocation,
        defaultCityPopulation: cityPopulation
    };
    var body = thymeleaf.render(view, params);

    function getCity(cityName) {
        var result = contentSvc.query({
                count: 1,
                contentTypes: [
                    app.name + ':city'
                ],
                "query": "_name = '" + cityName + "'"
            }
        );

        return result.hits[0];
    }

    return {
        contentType: 'text/html',
        body: body
    };
}

exports.get = handleGet;