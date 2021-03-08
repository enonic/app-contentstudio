/**
 * Helper class that encapsulates webdriverio
 * and sets up mocha hooks for easier test writing.
 */
function WebDriverHelper() {
    this.browser = null;
}

WebDriverHelper.prototype.getBrowser = function () {
    return this.browser;
};

const makeChromeOptions = (headless, width) => ({
    "args": [
        ...(headless ? ["--headless", "--disable-gpu", "--no-sandbox"] : []),
        "--lang=en",
        '--disable-extensions',
        `--window-size=${width},1100`
    ]
});

/**
 * Sets up a before and after mocha hook
 * that initialize and terminate the webdriverio session.
 */
WebDriverHelper.prototype.setupBrowser = function setupBrowser() {
    let _this = this;
    before(async function () {
        let PropertiesReader = require('properties-reader');
        let path = require('path');
        let webdriverio = require('webdriverio');
        let file = path.join(__dirname, '/../browser.properties');
        let properties = PropertiesReader(file);
        let browser_name = properties.get('browser.name');
        let platform_name = properties.get('platform');
        let baseUrl = properties.get('base.url');
        let isHeadless = properties.get('is.headless');
        let width = properties.get('browser.width');
        console.log('is Headless ##################### ' + isHeadless);
        console.log('browser name ##################### ' + browser_name);
        console.log('browser width ##################### ' + width);
        let options = {
            logLevel: "error",
            automationProtocol: "webdriver",
            path: "/wd/hub",
            capabilities: {
                browserName: browser_name,
                'goog:chromeOptions': makeChromeOptions(isHeadless, width)
            }
        };
        _this.browser = await webdriverio.remote(options);
        await _this.browser.url(baseUrl);
        console.log('webdriverio #####################  ' + 'is  initialized!');
        return _this.browser;
    });
    after(async function () {
        await _this.browser.deleteSession();
    });
    afterEach(function () {
        let state = this.currentTest.state ? this.currentTest.state.toString().toUpperCase() : 'FAILED';
        return console.log('Test:', this.currentTest.title, ' is  ' + state);
    });
};
module.exports = new WebDriverHelper();
