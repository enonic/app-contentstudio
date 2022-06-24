const path = require('path')
const {ReportAggregator, HtmlReporter} = require('wdio-html-nice-reporter');
exports.config = {

    //
    // ==================
    // Specify Test Files
    // ==================
    specs: [
        __dirname + '/specs/page-editor/*.spec.js'
    ],
    exclude: [
        __dirname + '/specs/page-editor/revert.site.with.components.spec.js',
        __dirname + '/specs/page-editor/text.component.cke.url.link.spec.js',
        __dirname + '/specs/page-editor/fragment.save.detach.spec.js',
        __dirname + '/specs/page-editor/text.component.image.outbound.spec.js',
        __dirname + '/specs/page-editor/fragment.layout.inspect.panel.spec',
    ],

    maxInstances: 1,
//"--headless",
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

    logLevel: 'error',
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
    // Set directory to store all logs into
    outputDir: "./build/mochawesome-report/",

    reporters: ['spec',
        ["html-nice", {
            outputDir:  "./build/mochawesome-report/",
            filename: 'spec-report.html',
            reportTitle: 'Tests for Page Editor',
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
        let reportAggregator = new ReportAggregator({
            outputDir: "./build/mochawesome-report/",
            filename: 'app-report.html',
            reportTitle: 'Content Studio, Page Editor Tests Report',
            browserName: capabilities.browserName,
            collapseTests: true
        });
        reportAggregator.clean();
        //todo
        global.reportAggregator = reportAggregator;
    },

    onComplete: function (exitCode, config, capabilities, results) {
        (async () => {
            console.log("########################### onComplete: Started");
            //await reportAggregator.createReport();
            await global.reportAggregator.createReport();
            console.log("########################### onComplete: App report created");
        })();
    },

};