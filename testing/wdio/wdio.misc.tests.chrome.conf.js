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
        path.join(__dirname, '../specs/misc/*.spec.js'),
    ],

    exclude: [
        path.join(__dirname, '../specs/misc/attachments.widget.spec.js'),
        path.join(__dirname, '../specs/misc/content.xdata.outbound.dependency.spec.js'),
        path.join(__dirname, '../specs/misc/content.xdata.textarea.spec.js'),
        path.join(__dirname, '../specs/misc/filtering.by.modifier.spec.js'),
        path.join(__dirname, '../specs/misc/filtering.by.owner.spec.js'),
        path.join(__dirname, '../specs/misc/filtering.by.workflow.spec.js'),
        path.join(__dirname, '../specs/misc/image.content.flip.rotate.spec.js'),
        path.join(__dirname, '../specs/misc/image.editor.crop.zoom.spec.js'),
        path.join(__dirname, '../specs/misc/image.editor.focus.spec.js'),
        path.join(__dirname, '../specs/misc/image.properties.photo.location.spec.js'),
        path.join(__dirname, '../specs/misc/image.wizard.photo.properties.spec.js'),
        path.join(__dirname, '../specs/misc/insert.image.dlg.apply.custom.style.spec.js'),
        path.join(__dirname, '../specs/misc/insert.image.dlg.custom.width.spec.js'),
        path.join(__dirname, '../specs/misc/insert.image.dlg.style.selector.spec.js'),
        path.join(__dirname, '../specs/misc/moved.modified.content.spec.js'),
        path.join(__dirname, '../specs/misc/publish.request.dialog.add.items.spec.js'),
        path.join(__dirname, '../specs/misc/revert.published.content.spec.js'),
        path.join(__dirname, '../specs/misc/text.component.cke.email.link.spec.js'),
        path.join(__dirname, '../specs/misc/text.component.cke.url.link.spec.js'),
        path.join(__dirname, '../specs/misc/text.component.content.link.spec.js'),
        path.join(__dirname, '../specs/misc/text.component.download.link.spec.js'),
        path.join(__dirname, '../specs/misc/text.component.image.outbound.spec.js'),
        path.join(__dirname, '../specs/misc/update.path.spec.js'),
        path.join(__dirname, '../specs/misc/versions.widget.check.status.spec.js'),
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
