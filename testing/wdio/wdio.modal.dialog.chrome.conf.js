const path = require('path');
const { TimelineService } = require('wdio-timeline-reporter/timeline-service');

exports.config = {

    specs: [
        path.join(__dirname, '../specs/modal-dialog/*.spec.js')
        //path.resolve('./specs/content-types/*.spec.js')
    ],

    maxInstances: 1,

    capabilities: [{
        browserName: 'chrome',
        browserVersion: '115.0.5790.170',
        'goog:chromeOptions': {
            "args": [
                "--headless", "--disable-gpu", "--no-sandbox",
                "--lang=en",
                '--disable-extensions',
                'window-size=1970,1000'
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
        timeout: 140000
    },
    // Set directory to store all logs into
    outputDir: "./build/logs/",

    reporters: ['spec','concise',
        ['timeline', { outputDir: './build/reports/timeline' }]
    ],

    // Hook that gets executed before the suite starts
    beforeSuite: function (suite) {
        browser.url(this.baseUrl);
    },
};