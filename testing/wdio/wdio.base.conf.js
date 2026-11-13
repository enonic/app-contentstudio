const path = require('path');
const appConst = require('../libs/app_const');

const specsDir = path.join(__dirname, '../specs');

const specPaths = (...patterns) => patterns.map((pattern) => path.join(specsDir, pattern));

// A hung WebDriver request blocks the worker for connectionRetryTimeout * (connectionRetryCount + 1)
const baseConfig = {
    maxInstances: 1,
    strictSelectors: false,

    capabilities: [
        {
            browserName: 'chrome',
            'wdio:enforceWebDriverClassic': true,
            'goog:chromeOptions': {
                args: [
                    '--headless=new',
                    '--disable-gpu',
                    '--no-sandbox',
                    '--lang=en',
                    '--disable-extensions',
                    '--disable-dev-shm-usage',
                    '--window-size=1970,1000',
                ],
            },
        },
    ],

    logLevel: 'info',
    coloredLogs: true,
    baseUrl: 'http://localhost:8080/admin',

    waitforTimeout: 3000,
    connectionRetryTimeout: 30000,
    connectionRetryCount: 1,

    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: appConst.SUITE_TIMEOUT,
    },

    outputDir: './build/reports/logs/',

    reporters: [
        ['spec', { color: true }],
        [
            'allure',
            {
                outputDir: './build/reports/allure',
                disableWebdriverStepsReporting: true,
                disableWebdriverScreenshotsReporting: true,
            },
        ],
    ],

    beforeSuite: function () {
        browser.url(this.baseUrl);
    },
};

function suiteConfig({ specs, exclude = [], ...overrides }) {
    return {
        ...baseConfig,
        ...overrides,
        specs: specPaths(...specs),
        exclude: specPaths(...exclude),
    };
}

module.exports = { suiteConfig };
