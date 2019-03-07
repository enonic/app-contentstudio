const webDriverHelper = require('./../libs/WebDriverHelper');
const appConst = require('./../libs/app_const');
const path = require('path');

function Page() {
}

Page.prototype.getBrowser = function () {
    return webDriverHelper.browser;
};
Page.prototype.alertAccept = function () {
    return this.getBrowser().alertAccept();
};

Page.prototype.isAlertPresent = function () {
    return this.getBrowser().alertText().then(() => {
        return true;
    }).catch(err => {
        if (err.seleniumStack.type == 'NoAlertOpenError') {
            return false
        } else {
            throw new Error(err);
        }
    })
};

Page.prototype.alertText = function () {
    return this.getBrowser().alertText().catch(err => {
        if (err.seleniumStack.type == 'NoAlertOpenError') {
            throw new Error("Alert is not open " + err);
        } else {
            throw new Error(err);
        }
    })
};

Page.prototype.numberOfElements = function (selector) {
    return this.getBrowser().elements(selector).then((res) => {
        return res.value.filter(el => {
            return this.getBrowser().elementIdDisplayed(el.ELEMENT);
        })
    }).then((result) => {
        return Object.keys(result).length;
    });
};

Page.prototype.keys = function (value) {
    return this.getBrowser().keys(value);
};
Page.prototype.getTitle = function () {
    return this.getBrowser().getTitle();
};

Page.prototype.isVisible = function (selector) {
    return this.getBrowser().isVisible(selector);
};

Page.prototype.isEnabled = function (selector) {
    return this.getBrowser().isEnabled(selector);
};

Page.prototype.waitForVisible = function (selector, ms) {
    return this.getBrowser().waitForVisible(selector, ms);
};

Page.prototype.waitForNotVisible = function (selector, ms) {
    return this.getBrowser().waitUntil(() => {
        return this.getDisplayedElements(selector).then(result => {
            return result.length == 0;
        })
    }, 2000).catch(err => {
        throw new Error("Timeout exception. Element " + selector + " still visible in: " + ms);
    });
};
Page.prototype.waitForSpinnerNotVisible = function (ms) {
    let message = "Spinner still displayed! timeout is " + ms;
    return this.getBrowser().waitUntil(() => {
        return this.isElementNotDisplayed(`//div[@class='spinner']`);
    }, ms, message);
};
Page.prototype.isElementNotDisplayed = function (selector) {
    return this.getDisplayedElements(selector).then(result => {
        return result.length == 0;
    })
};
Page.prototype.isSpinnerVisible = function () {
    return this.getBrowser().isVisible(`//div[@class='spinner']`);
};

Page.prototype.doClick = function (selector) {
    return this.getBrowser().click(selector).catch(err => {
        throw Error('Error when clicking on ' + err);
    })
};
Page.prototype.doDoubleClick = function (selector) {
    return this.getBrowser().doubleClick(selector).catch(err => {
        throw Error('Error when doubleClick on the element' + err);
    })
};
Page.prototype.typeTextInInput = function (selector, text) {
    return this.getBrowser().setValue(selector, text).catch(err => {
        throw new Error('text was not set in the input ' + err);
    })
};
Page.prototype.clearElement = function (selector) {
    return this.getBrowser().clearElement(selector);
};

Page.prototype.element = function (selector) {
    return this.getBrowser().element(selector);
};
Page.prototype.elements = function (selector) {
    return this.getBrowser().elements(selector);
};

Page.prototype.getText = function (selector) {
    return this.getBrowser().getText(selector);
};
Page.prototype.waitForExist = function (selector, ms) {
    return this.getBrowser().waitForExist(selector, ms);
};

Page.prototype.waitForEnabled = function (selector, ms) {
    return this.getBrowser().waitForEnabled(selector, ms);
};

Page.prototype.waitForDisabled = function (selector, ms) {
    return this.getBrowser().waitForEnabled(selector, ms, true);
};
Page.prototype.isSelected = function (selector) {
    return this.getBrowser().isSelected(selector);
};
Page.prototype.hasFocus = function (selector) {
    return this.getBrowser().hasFocus(selector);
};
Page.prototype.getElementId = function (ele) {
    return ele.value.ELEMENT;
};
Page.prototype.isAttributePresent = function (selector, atrName) {
    return this.getBrowser().getAttribute(selector, atrName).then(result => {
        if (result == null) {
            return false;
        } else {
            return true;
        }
    })
};

Page.prototype.getDisplayedElements = function (selector) {
    return this.getBrowser().elements(selector).then(elems => {
        let pr = elems.value.map(el => this.getBrowser().elementIdDisplayed(el.ELEMENT));
        //return Promise.all(pr).then(result=> {
        //    return elems.value.filter((el,i)=>result[i].value);
        //});
        return Promise.all(pr).then(result => elems.value.filter((el, i) => result[i].value));
    })
};

Page.prototype.execute = function (script) {
    return this.getBrowser().execute(script);
};

Page.prototype.doClickOnCloseInBrowser = function () {
    return this.getBrowser().execute("window.close();");
};

Page.prototype.isElementDisplayed = function (selector) {
    return this.getDisplayedElements(selector).then(result => {
        return result.length > 0;
    })
};

Page.prototype.getTextFromElements = function (selector) {
    let json = [];
    return this.getBrowser().elements(selector).then(result => {
        result.value.forEach((val) => {
            json.push(this.getBrowser().elementIdText(val.ELEMENT));
        });
        return Promise.all(json).then((p) => {
            return p;
        });
    }).then(responses => {
        let res = [];
        responses.forEach(str => {
            return res.push(str.value);
        });
        return res;
    });
};

Page.prototype.getTextFromInput = function (selector) {
    return this.getBrowser().getAttribute(selector, 'value');
};
Page.prototype.switchToParentFrame = function () {
    return this.getBrowser().frameParent();
};
Page.prototype.saveScreenshot = function (name) {
    let screenshotsDir = path.join(__dirname, '/../build/screenshots/');
    return this.getBrowser().saveScreenshot(screenshotsDir + name + '.png').then(() => {
        console.log('screenshot is saved ' + name);
    }).catch(err => {
        console.log('screenshot was not saved ' + screenshotsDir + ' ' + err);
    })
};
Page.prototype.getCSSProperty = function (selector, attributeName) {
    return this.getBrowser().getCSSProperty(selector, attributeName);
};

Page.prototype.getAttribute = function (selector, attributeName) {
    return this.getBrowser().getAttribute(selector, attributeName);
};

Page.prototype.frame = function (id) {
    return this.getBrowser().frame(id).catch(err => {
        console.log('Error when switch to frame ' + id);
        throw new Error('Error when switch to frame  ' + id);
    })
};

Page.prototype.waitForNotificationMessage = function () {
    return this.getBrowser().waitForVisible(`//div[@class='notification-content']/span`, appConst.TIMEOUT_5).then(() => {
        return this.getBrowser().getText(`//div[@class='notification-content']/span`);
    })
};

Page.prototype.waitForExpectedNotificationMessage = function (expectedMessage) {
    let selector = `//div[contains(@id,'NotificationMessage')]//div[contains(@class,'notification-content')]//span[contains(.,'${expectedMessage}')]`;
    return this.getBrowser().waitForVisible(selector, appConst.TIMEOUT_3).catch((err) => {
        this.saveScreenshot('err_notification_mess');
        throw new Error('expected notification message was not shown! ' + err);
    })
};

Page.prototype.waitForErrorNotificationMessage = function () {
    let selector = `//div[contains(@id,'NotificationMessage') and @class='notification error']//div[contains(@class,'notification-content')]/span`;
    return this.getBrowser().waitForVisible(selector, appConst.TIMEOUT_3).then(() => {
        return this.getBrowser().getText(selector);
    })
};

Page.prototype.waitForNotificationWarning = function () {
    let selector = `//div[contains(@id,'NotificationMessage') and @class='notification warning']//div[contains(@class,'notification-content')]/span`;
    return this.getBrowser().waitForVisible(selector, appConst.TIMEOUT_3).then(() => {
        return this.getBrowser().getText(selector);
    })
};
Page.prototype.waitUntilInvalid = function (selector) {
    return this.getBrowser().waitUntil(() => {
        return this.getBrowser().getAttribute(selector, 'class').then(result => {
            return result.includes('invalid');
        });
    }, 3000).then(() => {
        return true;
    }).catch((err) => {
        return false;
    });
};
Page.prototype.hasDefaultFocus = function (selector) {
    return this.hasFocus(selector);
};
Page.prototype.pressEscKey = function () {
    return this.getBrowser().keys(['Escape']);
};
module.exports = new Page();
