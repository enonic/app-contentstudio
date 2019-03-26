/**
 * Created on 02.12.2017.
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
        `window-size=${width},1100`
    ]
});

/**
 * Sets up a before and after mocha hook
 * that initialize and terminate the webdriverio session.
 */
WebDriverHelper.prototype.setupBrowser = function setupBrowser() {
    let _this = this;
    before(function () {
        let PropertiesReader = require('properties-reader');
        let path = require('path');
        let webdriverio = require('webdriverio');
        let file = path.join(__dirname, '/../browser.properties');
        let properties = PropertiesReader(file);
        let browser_name = properties.get('browser.name');
        let platform_name = properties.get('platform');
        let baseUrl = properties.get('base.url');
        let chromeBinPath = properties.get('chrome.bin.path');
        let isHeadless = properties.get('is.headless');
        let width = properties.get('browser.width');
        console.log('is Headless ##################### ' + isHeadless);
        console.log('browser name ##################### ' + browser_name);
        console.log('browser width ##################### ' + width);
        let options = {
            desiredCapabilities: {
                browserName: browser_name,
                platform: platform_name,
                binary: chromeBinPath,
                chromeOptions: makeChromeOptions(isHeadless, width)
            }
        };
        _this.browser = webdriverio
            .remote(options)
            .init().url(baseUrl);
        console.log('webdriverio #####################  ' + 'is  initialized!');
        return _this.browser;
    });
    after(function () {
        return _this.browser.end();
    });
    afterEach(function () {
        let state = this.currentTest.state ? this.currentTest.state.toString().toUpperCase() : 'FAILED';
        return console.log('Test:', this.currentTest.title, ' is  ' + state);

    });
};

module.exports = new WebDriverHelper();