const path = require('path')
const {ReportAggregator, HtmlReporter} = require('wdio-html-nice-reporter');
exports.config = {

    //
    // ==================
    // Specify Test Files
    // ==================
    specs: [
        __dirname + '/specs/*.spec.js'
    ],
    exclude: [
        __dirname + '/specs/content.unsaved.changes.spec.js'
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
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 3000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout: 6000,
    //
    // Default request retries count
    connectionRetryCount: 3,

    services: ['geckodriver'],

    framework: 'mocha',
    mochaOpts: {
        timeout: 70000
    },
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: http://webdriver.io/guide/testrunner/reporters.html
    reporters: ['spec',
        ["html-nice", {
            outputDir: './build/mochawesome-report/',
            filename: 'report.html',
            reportTitle: 'Tests for Wizards, Grid',
            linkScreenshots: true,
            //to show the report in a browser when done
            showInBrowser: true,
            collapseTests: false,
            //to turn on screenshots after every test
            useOnAfterCommandForScreenshot: false,
        }
        ]
    ],

    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
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
            filename: 'report.html',
            reportTitle: 'Content Studio, Wizard, Grid Tests Report',
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