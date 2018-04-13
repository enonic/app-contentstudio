var portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/xp/thymeleaf');
var contentSvc = require('/lib/xp/content');

var view = resolve('cities-distance-facet.part.html');

function handleGet(req) {

    var currentCityName;
    var cities;

    if (req.params.city) {
        var city = getCity(req.params.city);
        if (city) {
            currentCityName = city.displayName;
            var cityLocation = city.data.cityLocation;
            cityLocation = cityLocation || "NaN,NaN";
            var coordinates = cityLocation.split(",");
            cities = contentSvc.query({
                    start: 0,
                    count: 50,
                    contentTypes: [
                        app.name + ':city'
                    ],
                    "sort": "geoDistance('data.cityLocation','" + city.data.cityLocation + "')",
                    "query": "_name != '" + currentCityName + "'",
                    "aggregations": {
                        "distance": {
                            "geo_distance": {
                                'field': "data.cityLocation",
                                'unit': "km",
                                'origin': {
                                    'lat': coordinates[0],
                                    'lon': coordinates[1]
                                },
                                'ranges': [{'from': 0, 'to': 1200}, {'from': 1200, 'to': 4000}, {'from': 4000, 'to': 12000},
                                    {'from': 12000}]
                            }
                        }
                    }
                }
            );
        }
    }

    if (!currentCityName) {
        currentCityName = "None";
    }

    if (!cities) {
        cities = contentSvc.query({
                start: 0,
                count: 25,
                contentTypes: [
                    app.name + ':city'
                ]
            }
        );
    }

    var content = portal.getContent();
    var currentPage = portal.pageUrl({
        path: content._path
    });

    var buckets;
    if (cities.aggregations.distance) {
        buckets = cities.aggregations.distance.buckets;
    }

    var params = {
        cities: cities.hits,
        total: cities.total,
        buckets: buckets,
        currentCity: currentCityName,
        currentPage: currentPage
    };

    var body = thymeleaf.render(view, params);

    return {
        contentType: 'text/html',
        body: body
    };

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
}

exports.get = handleGet;