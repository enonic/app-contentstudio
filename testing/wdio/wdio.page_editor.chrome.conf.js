const path = require('path');
const propertiesReaderModule = require('properties-reader');
const propertiesReader = propertiesReaderModule.propertiesReader || propertiesReaderModule.default || propertiesReaderModule;
const file = path.join(__dirname, '/../browser.properties');
const properties = propertiesReader({ sourceFile: file });
const browser_version = properties.get('browser.version');

exports.config = {

    specs: [
        path.join(__dirname, '../specs/page-editor/*.spec.js'),
    ],

    exclude: [
        path.join(__dirname, '../specs/page-editor/app.generic.custom.error.handling.spec.js'),
        path.join(__dirname, '../specs/page-editor/expanding.pcv.tree.spec.js'),
        path.join(__dirname, '../specs/page-editor/fragment.layout.inspect.panel.spec.js'),
        path.join(__dirname, '../specs/page-editor/fragment.layout.pcv.spec.js'),
        path.join(__dirname, '../specs/page-editor/fragment.save.detach.spec.js'),
        path.join(__dirname, '../specs/page-editor/generate.name.for.fragments.spec.js'),
        path.join(__dirname, '../specs/page-editor/image.text.component.as.fragment.spec.js'),
        path.join(__dirname, '../specs/page-editor/insert.part.htmlarea.spec.js'),
        path.join(__dirname, '../specs/page-editor/layout.insert.image.save.as.fragment.spec.js'),
        path.join(__dirname, '../specs/page-editor/my.first.site.country.spec.js'),
        path.join(__dirname, '../specs/page-editor/page.template.controller.spec.js'),
        path.join(__dirname, '../specs/page-editor/page.template.insert.layout.spec.js'),
        path.join(__dirname, '../specs/page-editor/portal.content.creating.spec.js'),
        path.join(__dirname, '../specs/page-editor/revert.site.with.components.spec.js'),
        path.join(__dirname, '../specs/page-editor/site.no.apps.selected.spec.js'),
        path.join(__dirname, '../specs/page-editor/site.reset.template.menu.item.spec.js'),
        path.join(__dirname, '../specs/page-editor/site.with.layout.component.spec.js'),
        path.join(__dirname, '../specs/page-editor/site.with.several.templates.spec.js'),
        path.join(__dirname, '../specs/page-editor/site.wizard.add.application.spec.js'),
        path.join(__dirname, '../specs/page-editor/swap.text.components.spec.js'),
        path.join(__dirname, '../specs/page-editor/template.config.spec.js'),
        path.join(__dirname, '../specs/page-editor/templates.dropdown.inspect.tab.spec.js'),
        path.join(__dirname, '../specs/page-editor/text.component.inspect.panel.spec.js'),
        path.join(__dirname, '../specs/page-editor/update.fragment.spec.js'),
        path.join(__dirname, '../specs/page-editor/updated.text.in.preview.panel.liveview.spec.js'),
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
    logLevel: 'trace',
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
