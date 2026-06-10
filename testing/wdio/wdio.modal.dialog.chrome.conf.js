const path = require('path');
const propertiesReaderModule = require('properties-reader');
const propertiesReader = propertiesReaderModule.propertiesReader || propertiesReaderModule.default || propertiesReaderModule;
const file = path.join(__dirname, '/../browser.properties');
const properties = propertiesReader({ sourceFile: file });
const browser_version = properties.get('browser.version');

exports.config = {

    specs: [
        //path.join(__dirname, '../specs/modal-dialog/*.spec.js'),
        //path.join(__dirname, '../specs/permissions/*.spec.js')
        path.join(__dirname, '../specs/modal-dialog/insert.link.email.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/move.content.spec.js'),
        path.join(__dirname, '../specs/permissions/access.control.changed.list.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/new.content.dialog.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/insert.link.url.validation.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/insert.relative.link.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/move.child.content.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/sort.content.dialog.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/delete.content.dialog.spec.js'),


    ],
    exclude: [
        path.join(__dirname, '../specs/modal-dialog/mobile.mode.preview.panel.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/mobile.browse.panel.toolbar.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/versions.widget.sorted.item.spec.js'),
        path.join(__dirname, '../specs/modal-dialog/wizard.compare.versions.dialog.spec.js'),
    ],
    maxInstances: 1,

    capabilities: [{
        browserName: 'chrome',
        "wdio:enforceWebDriverClassic": true,
        'goog:chromeOptions': {
            "args": [
                "--disable-gpu", "--no-sandbox",
                "--lang=en",
                "--headless=new",
                '--disable-extensions',
                '--disable-dev-shm-usage',
                '--window-size=1970,1000'
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
        timeout: 140000
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
