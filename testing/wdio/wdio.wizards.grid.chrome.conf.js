const path = require('path');
const propertiesReaderModule = require('properties-reader');
const propertiesReader = propertiesReaderModule.propertiesReader || propertiesReaderModule.default || propertiesReaderModule;
const file = path.join(__dirname, '/../browser.properties');
const properties = propertiesReader({ sourceFile: file });
const browser_version = properties.get('browser.version');

exports.config = {

    specs: [
        path.join(__dirname, '../specs/*.spec.js'),
    ],
    exclude: [
        path.join(__dirname, '../specs/browse.selection.controller.spec.js'),
        path.join(__dirname, '../specs/content.name.upper.lower.case.spec.js'),
        path.join(__dirname, '../specs/content.unsaved.changes.spec.js'),
        path.join(__dirname, '../specs/content.wizard.owner.deleted.spec.js'),
        path.join(__dirname, '../specs/content.workflow.state.spec.js'),
        path.join(__dirname, '../specs/cookies.service.spec.js'),
        path.join(__dirname, '../specs/default.error.page.spec.js'),
        path.join(__dirname, '../specs/outbound.dependency.rollback.version.spec.js'),
        path.join(__dirname, '../specs/remove.app.in.site.with.descriptor.spec.js'),
        path.join(__dirname, '../specs/site.app.uninstalled.spec.js'),
        path.join(__dirname, '../specs/site.configurator.htmlarea.spec.js'),
        path.join(__dirname, '../specs/site.configurator.required.input.spec.js'),
        path.join(__dirname, '../specs/site.with.meta.fields.spec.js'),
        path.join(__dirname, '../specs/wizard.detailspanel.update.dependencies.spec.js'),
        path.join(__dirname, '../specs/wizard.xdata.long.form.spec.js'),
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
