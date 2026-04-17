const path = require('path');
const propertiesReaderModule = require('properties-reader');
const propertiesReader = propertiesReaderModule.propertiesReader || propertiesReaderModule.default || propertiesReaderModule;
const file = path.join(__dirname, '/../browser.properties');
const properties = propertiesReader({ sourceFile: file });
const browser_version = properties.get('browser.version');
const width = properties.get('browser.width');
const height = properties.get('browser.height');

exports.config = {

    specs: [
        //path.join(__dirname, '../specs/misc/*.spec.js')
        path.join(__dirname, '../specs/misc/shortcut.publish.dialog.spec.js'),
        path.join(__dirname, '../specs/misc/content.duplicate.spec.js'),
        path.join(__dirname, '../specs/misc/contentitem.preview.toolbar.spec.js'),
    ],
    exclude: [
        //path.join(__dirname, '../specs/misc/revert.published.content.spec.js'),
        //path.join(__dirname, '../specs/misc/versions.widget.check.status.spec.js'),
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
                `window-size=${width},${height}`
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
        timeout: 120000
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
