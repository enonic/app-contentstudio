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
}

const makeChromeOptions = headless => ({
    "args": [
        ...(headless ? ["--headless", "--disable-gpu", "--no-sandbox"] : []),
        "--lang=en",
        '--disable-extensions',
        'window-size=1920,1100'
    ]
});

/**
 * Sets up a before and after mocha hook
 * that initialize and terminate the webdriverio session.
 */
WebDriverHelper.prototype.setupBrowser = function setupBrowser() {
    var _this = this;
    before(function () {
        var PropertiesReader = require('properties-reader');
        var path = require('path')
        var webdriverio = require('webdriverio');
        var file = path.join(__dirname, '/../browser.properties');
        var properties = PropertiesReader(file);
        var browser_name = properties.get('browser.name');
        var platform_name = properties.get('platform');
        var baseUrl = properties.get('base.url');
        var chromeBinPath = properties.get('chrome.bin.path');
        var isHeadless = properties.get('is.headless');
        console.log('is Headless ##################### ' + isHeadless);
        console.log('browser name ##################### ' + browser_name);
        var options = {
            desiredCapabilities: {
                browserName: browser_name,
                platform: platform_name,
                binary: chromeBinPath,
                chromeOptions: makeChromeOptions(isHeadless)
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