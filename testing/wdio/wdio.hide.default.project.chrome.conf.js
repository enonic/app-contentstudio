const path = require('path');
const {TimelineService} = require('wdio-timeline-reporter/timeline-service');
const PropertiesReader = require('properties-reader');
const file = path.join(__dirname, '/../browser.properties');
const properties = PropertiesReader(file);
const browser_version = properties.get('browser.version');
const width = properties.get('browser.width');
const height = properties.get('browser.height');

exports.config = {

    specs: [
        path.join(__dirname, '../specs/hide-default-project/*.spec.js'),
    ],

    maxInstances: 1,

    capabilities: [{
        browserName: 'chrome',
        browserVersion: browser_version,
        'goog:chromeOptions': {
            "args": [
                "--headless", "--disable-gpu", "--no-sandbox",
                "--lang=en",
                '--disable-extensions',
                `window-size=${width},${height}`
                `--window-size=${width},${height}`
            ]
        }
    }],
    logLevel: 'info',
    //
    // Enables colors for log output.
    coloredLogs: true,

    baseUrl: 'http://localhost:8080/admin/tool',
    //
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 3000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout: 160000,
    //
    // Default request retries count
    connectionRetryCount: 3,

    //services: ['chromedriver'],
    services: [[TimelineService]],

    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    // Set directory to store all logs into
    outputDir: "./build/reports/logs/",

    reporters: ['concise',
        ['timeline', {outputDir: './build/reports/timeline'}],
    ],

    // Hook that gets executed before the suite starts
    beforeSuite: function (suite) {
        browser.url(this.baseUrl);
    },
};