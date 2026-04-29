const path = require('path');
const propertiesReaderModule = require('properties-reader');
const propertiesReader = propertiesReaderModule.propertiesReader || propertiesReaderModule.default || propertiesReaderModule;
const file = path.join(__dirname, '/../browser.properties');
const properties = propertiesReader({ sourceFile: file });
const browser_version = properties.get('browser.version');

exports.config = {

    specs: [
        //path.join(__dirname, '../specs/publish/*.spec.js'),
        //path.join(__dirname, '../specs/issue/*.spec.js')
        path.join(__dirname, '../specs/publish/refresh.request.publishing.dialog.spec.js'),
        path.join(__dirname, '../specs/publish/browse.panel.mark.as.ready.single.content.spec.js'),
        path.join(__dirname, '../specs/issue/close.issue.with.item.spec.js'),
        path.join(__dirname, '../specs/issue/close.issue.no.items.spec.js'),
        path.join(__dirname, '../specs/issue/issue.status.selector.spec.js'),
        path.join(__dirname, '../specs/issue/issue.publish.two.items.spec.js'),

    ],

    maxInstances: 1,

    capabilities: [{
        browserName: 'chrome',
        browserVersion: browser_version,
        "wdio:enforceWebDriverClassic": true,
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

    baseUrl: 'http://localhost:8080/admin',
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


    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 150000
    },
    // Set directory to store all logs into
    outputDir: "./build/reports/logs/",

    reporters: [['spec', {
        color: true
    }],
        ['allure',
            {outputDir: './build/reports/allure', disableWebdriverStepsReporting: true, disableWebdriverScreenshotsReporting: true}]
    ],

    // Hook that gets executed before the suite starts
    beforeSuite: function (suite) {
        browser.url(this.baseUrl);
    },
};
