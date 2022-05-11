const path = require('path')
const {ReportAggregator, HtmlReporter} = require('wdio-html-nice-reporter');
const {HtmlReporterOptions} = require('wdio-html-nice-reporter/lib/types');
exports.config = {

    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //
    specs: [
        //path.resolve(__dirname, '../specs/*.spec.js')
        //path.resolve(__dirname, '../specs/browse.selection.controller.spec.js')
        //path.resolve(__dirname, '../specs/browse.toolbar.shortcut.spec.js')
        //path.resolve(__dirname, '../specs/call.app.controller.spec.js')
        //path.resolve(__dirname, '../specs/content.filter.panel.spec.js')
        //path.resolve(__dirname, '../specs/content.name.upper.lower.case.spec.js')
        path.resolve(__dirname, '../specs/content.toggle.icon.spec.js')
        //path.resolve(__dirname, '../specs/browse.panel.grid.context.menu.spec.js')
        //path.join(__dirname, '/specs/browse.panel.toolbar.spec.js')
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
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [{
        browserName: 'firefox',
        'moz:firefoxOptions': {
            "args": [
                 "--disable-gpu", "--no-sandbox",
                "--lang=en",
                '--disable-extensions',
                //'--window-size=1970,1100'
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
    connectionRetryTimeout: 90000,
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
            outputDir:  path.join(__dirname, '/../build/mochawesome-report/'),
            filename: 'report1.html',
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
    outputDir:  path.join(__dirname, '/../build/mochawesome-report/'),

    // reporterOptions: {
    //     allure: {
    //         outputDir: './e2e/test-reports/allure-results'
    //     }
    //         [HtmlReporter, {
    //         outputDir: './e2e/test-reports/',
    //         filename: 'report.html',
    //         reportTitle: 'Test Report Title',
    //         showInBrowser: true,
    //         useOnAfterCommandForScreenshot: false,
    //     }
    //         ]
    // },

    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides a several hooks you can use to intefere the test process in order to enhance
    // it and build services around it. You can either apply a single function to it or an array of
    // methods. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    //
    // Gets executed once before all workers get launched.
    // onPrepare: function (config, capabilities) {
    // },
    //
    // Gets executed before test execution begins. At this point you can access to all global
    // variables like `browser`. It is the perfect place to define custom commands.
    // before: function (capabilities, specs) {
     //    browser.init()
    // },
    //
    // Hook that gets executed before the suite starts
     beforeSuite: function (suite) {
         browser.url(this.baseUrl);
    },
    //
    // Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
    // beforeEach in Mocha)
    // beforeHook: function () {
    // },
    //
    // Hook that gets executed _after_ a hook within the suite starts (e.g. runs after calling
    // afterEach in Mocha)
    // afterHook: function () {
    // },
    //
    // Function to be executed before a test (in Mocha/Jasmine) or a step (in Cucumber) starts.
    // beforeTest: function (test) {
    // },
    //
    // Runs before a WebdriverIO command gets executed.
    // beforeCommand: function (commandName, args) {
    // },
    //
    // Runs after a WebdriverIO command gets executed
    // afterCommand: function (commandName, args, result, error) {
    // },
    //
    // Function to be executed after a test (in Mocha/Jasmine) or a step (in Cucumber) starts.
    // afterTest: function (test) {
    // },
    //
    // Hook that gets executed after the suite has ended
    // afterSuite: function (suite) {
    // },
    //
   
    //
    // Gets executed after all tests are done. You still have access to all global variables from
    // the test.
    // after: function (result, capabilities, specs) {
    // },
    //
    // Gets executed after all workers got shut down and the process is about to exit.
    // onComplete: function(exitCode, config, capabilities) {
    // }
    onPrepare: function (config, capabilities) {
        console.log ("__dirname #####################  " + __dirname);
        console.log ("__dirname #####################@@@@@@@  " + path.join(__dirname, '/../build/mochawesome-report/'));
        reportAggregator = new ReportAggregator({
            //outputDir:  path.join(__dirname, '../build/mochawesome-report/'),
            outputDir: '/build/mochawesome-report/',
            filename: 'report.html',
            reportTitle: 'Content Studio, Wizard, Grid Report',
            browserName : capabilities.browserName,
            collapseTests: true
        });
        reportAggregator.clean() ;
    },
    //
    onComplete: function(exitCode, config, capabilities, results) {
        (async () => {
            await reportAggregator.createReport();
        })();
    },

};