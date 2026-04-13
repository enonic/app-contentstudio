const path = require('path');
const propertiesReaderModule = require('properties-reader');
const propertiesReader = propertiesReaderModule.propertiesReader || propertiesReaderModule.default || propertiesReaderModule;
const file = path.join(__dirname, '/../browser.properties');
const properties = propertiesReader({ sourceFile: file });
const browser_version = properties.get('browser.version');

exports.config = {

    specs: [
        path.join(__dirname, '../specs/browse.panel.grid.context.menu.spec.js'),
        path.join(__dirname, '../specs/browse.panel.properties.widget.spec.js'),
        path.join(__dirname, '../specs/browse.toolbar.shortcut.spec.js'),
        path.join(__dirname, '../specs/call.app.controller.spec.js'),
        path.join(__dirname, '../specs/content.filter.panel.export.spec.js'),
        path.join(__dirname, '../specs/content.filter.panel.spec.js'),
        path.join(__dirname, '../specs/content.item.preview.spec.js'),
        path.join(__dirname, '../specs/content.toggle.icon.spec.js'),
        path.join(__dirname, '../specs/response.headers.spec.js'),
        path.join(__dirname, '../specs/wizard.settings.panel.spec.js'),
        path.join(__dirname, '../specs/browse.panel.selections.spec.js'),
        path.join(__dirname, '../specs/launcher.panel.spec.js'),
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
        timeout: 160000
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
