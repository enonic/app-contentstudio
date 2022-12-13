const path = require('path')
const {ReportAggregator, HtmlReporter} = require('wdio-html-nice-reporter');
exports.config = {

    //
    // ==================
    // Specify Test Files
    // ==================
    specs: [
        __dirname +  '/specs/content-types-2/*.spec.js'
    ],
    exclude: [
        __dirname + '/specs/content-types-2/occurrences.image.selector.spec.js'
    ],

    maxInstances: 1,

    capabilities: [{
        browserName: 'firefox',
        'moz:firefoxOptions': {
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
    waitforTimeout: 2000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout:  90000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    services: ['geckodriver'],

    framework: 'mocha',
    mochaOpts: {
        timeout: 70000
    },
    // Set directory to store all logs into
    outputDir: "./build/mochawesome-report/",

    reporters: ['spec',
        ["html-nice", {
            outputDir: './build/mochawesome-report/',
            filename: 'report.html',
            reportTitle: 'Tests for Input Types (2)',
            linkScreenshots: true,
            //to show the report in a browser when done
            showInBrowser: true,
            collapseTests: false,
            //to turn on screenshots after every test
            useOnAfterCommandForScreenshot: false,
        }
        ]
    ],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    // Hook that gets executed before the suite starts
    beforeSuite: function (suite) {
        browser.url(this.baseUrl);
    },

    onPrepare: function (config, capabilities) {

        reportAggregator = new ReportAggregator({
            outputDir: './build/mochawesome-report/',
            filename: 'master-report.html',
            reportTitle: 'Tests for Input Types (2) Report',
            browserName: capabilities.browserName,
            collapseTests: true
        });
        reportAggregator.clean();
    },

    onComplete: function (exitCode, config, capabilities, results) {
        (async () => {
            await reportAggregator.createReport();
        })();
    },

};