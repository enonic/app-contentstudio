const path = require('path')
const {ReportAggregator, HtmlReporter} = require('wdio-html-nice-reporter');
exports.config = {

    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    specs: [
        //path.join(__dirname, '/specs/*.spec.js')
        __dirname +  '/specs/browse.panel.toolbar.spec.js'
    ],
    maxInstances: 1,
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude option in
    // order to group specific specs to a specific capability.
    //
    capabilities: [{
        browserName: 'firefox',
        'moz:firefoxOptions': {
            "args": [
                "--headless", "--disable-gpu", "--no-sandbox",
                "--lang=en",
                '--disable-extensions',
                "--width=1920",
                "--height=1000"
            ]
        }

    }],
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: silent | verbose | command | data | result | error
    logLevel: 'info',
    //
    // Enables colors for log output.
    coloredLogs: true,

    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://localhost:8080/admin/tool',
    //
    // Default timeout for all waitForXXX commands.
    waitforTimeout: 2000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout: 9000,
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
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: http://webdriver.io/guide/testrunner/reporters.html
    reporters: ['spec',
        [HtmlReporter, {
            outputDir: __dirname +'/build/mochawesome-report/',
            filename: 'report.html',
            reportTitle: 'Suite Report Title',
            linkScreenshots: true,
            //to show the report in a browser when done
            showInBrowser: true,
            collapseTests: false,
            //to turn on screenshots after every test
            useOnAfterCommandForScreenshot: false,
        }
        ]
   ],
    outputDir: __dirname+"/build",

    //
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
            //outputDir:  path.join(__dirname, '/build/mochawesome-report'),
            outputDir: __dirname +'/build/mochawesome-report/',
            filename: 'report.html',
            reportTitle: 'Content Studio, Wizard, Grid Report',
            browserName : capabilities.browserName,
            collapseTests: true
        });
        reportAggregator.clean() ;
    },

    onComplete: function(exitCode, config, capabilities, results) {
        (async () => {
            await reportAggregator.createReport();
        })();
    },

};