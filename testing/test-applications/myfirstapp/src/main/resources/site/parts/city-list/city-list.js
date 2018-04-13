var contentLib = require('/lib/xp/content'); // Import the content library functions
var portal = require('/lib/xp/portal'); // Import the portal functions
var thymeleaf = require('/lib/xp/thymeleaf'); // Import the Thymeleaf rendering function

// Handle the GET request
exports.get = function (req) {

    // Get the part configuration for the map
    var config = portal.getComponent().config;
    var zoom = parseInt(config.zoom) && config.zoom <= 15 && config.zoom >= 1 ? config.zoom : 10;
    var mapType = config.mapType || 'ROADMAP';

    // String that will be inserted to the head of the document
    var googleMaps = '<script src="http://maps.googleapis.com/maps/api/js"></script>';

    // Get the country content and extract the needed data from the JSON
    var result = contentLib.getChildren({
        key: portal.getContent()._id
    });
    var hits = result.hits;

    var cities = [];

    if (hits.length > 0) {
        googleMaps += '<script>function initialize() {';

        // Loop through the contents and extract the needed data
        for (var i = 0; i < hits.length; i++) {

            var city = {};
            city.name = hits[i].displayName;
            city.cityLocation = hits[i].data.cityLocation;
            city.cityPopulation = hits[i].data.cityPopulation ? 'Population: ' + hits[i].data.cityPopulation : null;
            city.mapId = 'googleMap' + i;

            cities.push(city);

            googleMaps += 'var center' + i + ' = new google.maps.LatLng(' + city.cityLocation + '); '

            googleMaps += 'var mapProp = {center:center' + i + ', zoom:' + zoom +
                          ', mapTypeId:google.maps.MapTypeId.' + mapType + ', scrollwheel: false };' +
                          'var map' + i + ' = new google.maps.Map(document.getElementById("googleMap' + i + '"),mapProp); ' +
                          'var marker = new google.maps.Marker({ position:center' + i + '}); marker.setMap(map' + i + ');';
        }

        googleMaps += '} google.maps.event.addDomListener(window, "load", initialize);</script>';
    }

    // Prepare the model object that will be passed to the view file
    var model = {
        cities: cities
    };

    // Specify the view file to use
    var view = resolve('city-list.html');

    // Return the response object
    return {
        body: thymeleaf.render(view, model),
        // Put the maps' javascript into the head of the document
        pageContributions: {
            headEnd: googleMaps
        }
    }
};