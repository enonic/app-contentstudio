const path = require('path')
const {ReportGenerator, HtmlReporter} = import('wdio-html-nice-reporter');
let reportAggregator;

exports.config = {

    specs: [
        //__dirname +  '/specs/content-types/attachments.wizard.spec.js'
       path.join(__dirname, '../specs/content-types/*.spec.js')
        //path.resolve('./specs/content-types/*.spec.js')
       //'./specs/content-types/*.spec.js'
    ],
    exclude: [
       // __dirname + './specs/content-types/image.editor.focus.spec.js',

    ],

    maxInstances: 1,

    capabilities: [{
        browserName: 'chrome',
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

    services: ['chromedriver'],

    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    // Set directory to store all logs into
    outputDir: "./build/reports/logs/",

    reporters: ['spec','concise',
        ['allure', {
            //
            // If you are using the "allure" reporter you should define the directory where
            // WebdriverIO should save all allure reports.
            outputDir: './build/reports/allureReports'
        }],
        // ["html-nice", {
        //     outputDir:  "./build/reports/html-reports/",
        //     filename: 'report.html',
        //     reportTitle: 'Tests for Input Types',
        //     linkScreenshots: true,
        //     //to show the report in a browser when done
        //     showInBrowser: true,
        //     collapseTests: false,
        //     //to turn on screenshots after every test
        //     useOnAfterCommandForScreenshot: false,
        // }
        // ]
    ],

    // Hook that gets executed before the suite starts
    beforeSuite: function (suite) {
        browser.url(this.baseUrl);
    },

    // onPrepare: function (config, capabilities) {
    //     reportAggregator = new ReportGenerator({
    //         outputDir: '../build/reports/html-reports/',
    //         filename: 'master-report.html',
    //         reportTitle: 'Input Types Test Report',
    //         browserName: 'chrome',
    //         collapseTests: true
    //     });
    //     //reportAggregator.clean();
    // },
    //
    // onComplete: function (exitCode, config, capabilities, results) {
    //     (async () => {
    //         console.log("Generating report!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    //         await reportAggregator.createReport();
    //     })();
     //},

};