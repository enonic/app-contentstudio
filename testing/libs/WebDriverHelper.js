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

const makeChromeOptions = (headless, width, height) => ({
    "args": [
        ...(headless ? ["--headless", "--disable-gpu", "--no-sandbox"] : []),
        "--lang=en",
        '--disable-extensions',
        `--window-size=${width},${height}`
    ]
});

/**
 * Sets up a before and after mocha hook
 * that initialize and terminate the webdriverio session.
 */
WebDriverHelper.prototype.setupBrowser = function setupBrowser(w, h) {
    let _this = this;
    let ww = w;
    let hh = h;
    before(async function () {
        let PropertiesReader = require('properties-reader');
        let path = require('path');
        let webdriverio = require('webdriverio');
        let file = path.join(__dirname, '/../browser.properties');
        let properties = PropertiesReader(file);
        let browser_name = properties.get('browser.name');
        let browser_version = properties.get('browser.version');
        let baseUrl = properties.get('base.url');
        let isHeadless = properties.get('is.headless');
        let width = ww === undefined ? properties.get('browser.width') : w;
        let height = hh === undefined ? properties.get('browser.height') : h;
        console.log('is Headless ##################### ' + isHeadless);
        console.log('browser name ##################### ' + browser_name);
        console.log('browser width ##################### ' + width);
        let options = {
            logLevel: 'error',
            automationProtocol: 'webdriver',
            capabilities: {
                browserName: browser_name,
                browserVersion: browser_version,
                "wdio:enforceWebDriverClassic": true,
                'goog:chromeOptions': makeChromeOptions(isHeadless, width, height)
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
