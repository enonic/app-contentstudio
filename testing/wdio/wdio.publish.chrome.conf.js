const path = require('path');
const propertiesReaderModule = require('properties-reader');
const propertiesReader = propertiesReaderModule.propertiesReader || propertiesReaderModule.default || propertiesReaderModule;
const file = path.join(__dirname, '/../browser.properties');
const properties = propertiesReader({ sourceFile: file });
const browser_version = properties.get('browser.version');

exports.config = {

    specs: [
        path.join(__dirname, '../specs/publish/*.spec.js'),
        path.join(__dirname, '../specs/issue/*.spec.js'),
    ],
    exclude: [
        path.join(__dirname, '../specs/publish/browse.panel.mark.as.ready.multiselection.spec.js'),
        path.join(__dirname, '../specs/publish/change.display.name.rename.published.content.spec.js'),
        path.join(__dirname, '../specs/publish/closed.issue.dependent.items.spec.js'),
        path.join(__dirname, '../specs/publish/content.publish.dialog.change.log.spec.js'),
        path.join(__dirname, '../specs/publish/hidden.schedule.icon.spec.js'),
        path.join(__dirname, '../specs/publish/request.publish.dialog.spec.js'),
        path.join(__dirname, '../specs/publish/request.publish.dialog.validation.spec.js'),
        path.join(__dirname, '../specs/publish/request.publishing.dialog.mark.as.ready.spec.js'),
        path.join(__dirname, '../specs/publish/unpublish.dialog.dependent.item.scheduled.spec.js'),
        path.join(__dirname, '../specs/publish/version.items.after.publishing.spec.js'),
        path.join(__dirname, '../specs/publish/wizard.mark.as.ready.spec.js'),
        path.join(__dirname, '../specs/publish/wizard.publish.menu.workflow.spec.js'),

        path.join(__dirname, '../specs/issue/create.issue.dialog.spec.js'),
        path.join(__dirname, '../specs/issue/issue.details.dialog.items.spec.js'),
        path.join(__dirname, '../specs/issue/issue.details.dialog.spec.js'),
        path.join(__dirname, '../specs/issue/issue.details.items.tab.selector.spec.js'),
        path.join(__dirname, '../specs/issue/issue.invalid.content.spec.js'),
        path.join(__dirname, '../specs/issue/issue.list.dialog.spec.js'),
        path.join(__dirname, '../specs/issue/issue.list.typefilter.spec.js'),
        path.join(__dirname, '../specs/issue/publish.close.issue.spec.js'),
        path.join(__dirname, '../specs/issue/publish.issue.by.user.spec.js'),
        path.join(__dirname, '../specs/issue/wizard.publish.menu.issue.item.spec.js'),
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
