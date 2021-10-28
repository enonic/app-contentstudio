const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const path = require('path');
const fs = require('fs');

class Page {
    constructor() {
        this.browser = webDriverHelper.browser;
    }

    getBrowser() {
        return this.browser;
    }

    // value: string | string[]
    keys(value) {
        return this.browser.keys(value);
    }

    findElement(selector) {
        return this.browser.$(selector);
    }

    findElements(selector) {
        return this.browser.$$(selector);
    }

    getTitle() {
        return this.browser.getTitle();
    }

    getSource() {
        return this.browser.getSource();
    }

    async getDisplayedElements(selector) {
        let elements = await this.findElements(selector);
        let pr = elements.map(el => el.isDisplayed());
        return await Promise.all(pr).then(result => {
            return elements.filter((el, i) => result[i]);
        });
    }

    pause(ms) {
        return this.browser.pause(ms);
    }

    async scrollAndClickOnElement(selector) {
        let element = await this.findElement(selector);
        await element.scrollIntoView();
        return await element.click();
    }

    async clickOnElement(selector) {
        let element = await this.findElement(selector);
        return await element.click();
    }

    async getText(selector) {
        let element = await this.findElement(selector);
        return await element.getText();
    }

    async getTextInElements(selector) {
        let strings = [];
        let elements = await this.findElements(selector);
        elements.forEach(el => {
            strings.push(el.getText());
        });
        return Promise.all(strings);
    }

    async getTextInDisplayedElements(selector) {
        let strings = [];
        let elements = await this.getDisplayedElements(selector);
        elements.forEach(el => {
            strings.push(el.getText());
        });
        return Promise.all(strings);
    }

    async clearTextInput(locator) {
        let inputElement = await this.findElement(locator);
        return await inputElement.setValue("");
    }

    async typeTextInInput(selector, text) {
        try {
            let inputElement = await this.findElement(selector);
            await inputElement.setValue(text);
            let value = await inputElement.getValue();
            //workaround for issue in WebdriverIO
            if (value == "") {
                await inputElement.setValue(text);
            }
            return await inputElement.pause(300);
        } catch (err) {
            throw new Error("Error when set value in input " + err);
        }
    }

    async addTextInInput(selector, text) {
        let inputElement = await this.findElement(selector);
        //await inputElement.clearValue();
        await inputElement.setValue(text);
        let value = await inputElement.getValue();
        //workaround for issue in WebdriverIO
        if (value == "") {
            await inputElement.addValue(text);
        }
        return await inputElement.pause(300);
    }

    //Wait for an element for the provided amount of milliseconds to be present within the DOM. Returns true if the selector matches at least one
    // element that exists in the DOM, otherwise throws an error.
    async waitForExist(selector, ms) {
        let element = await this.findElement(selector);
        return await element.waitForExist({timeout: ms});
    }

    async isClickable(selector) {
        let element = await this.findElement(selector);
        return await element.isClickable();
    }

    async getTextInInput(selector) {
        let inputElement = await this.findElement(selector);
        return await inputElement.getValue(selector);
    }

    async clearInputText(selector) {
        try {
            let inputElement = await this.findElement(selector);
            await inputElement.waitForDisplayed(1000);
            await inputElement.clearValue();
            return await inputElement.pause(3000);
        } catch (err) {
            throw new Error("Error when clear value in input" + err);
        }
    }

    saveScreenshot(name) {
        let screenshotsDir = path.join(__dirname, '/../build/mochawesome-report/screenshots/');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, {recursive: true});
        }
        return this.browser.saveScreenshot(screenshotsDir + name + '.png').then(() => {
            console.log('screenshot is saved ' + name);
        }).catch(err => {
            console.log('screenshot was not saved ' + screenshotsDir + ' ' + err);
        })
    }

    async isElementDisplayed(selector) {
        let elems = await this.getDisplayedElements(selector);
        return elems.length > 0;
    }

    async isElementEnabled(selector) {
        let element = await this.findElement(selector);
        return await element.isEnabled();
    }

    async waitForElementEnabled(selector, ms) {
        let el = await this.findElements(selector);
        if (el.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (el.length === 0) {
            throw new Error("Element was not found:" + selector);
        }
        return await el[0].waitForEnabled({timeout: ms});
    }

    async waitForDisplayedElementEnabled(selector, ms) {
        let el = await this.getDisplayedElements(selector);
        if (el.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (el.length === 0) {
            throw new Error("Element was not found:" + selector);
        }
        return await el[0].waitForEnabled({timeout: ms});
    }

    async waitForElementDisabled(selector, ms) {
        let element = await this.findElements(selector);
        if (element.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (element.length === 0) {
            throw new Error("Element was not found:" + selector);
        }
        return await element[0].waitForEnabled({timeout: ms, reverse: true});
    }

    async waitForDisplayedElementDisabled(selector, ms) {
        let element = await this.getDisplayedElements(selector);
        if (element.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (element.length === 0) {
            throw new Error("Element was not found:" + selector);
        }

        return await element[0].waitForEnabled({timeout: ms, reverse: true});
    }

    waitForElementNotDisplayed(selector, ms) {
        return this.getBrowser().waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length === 0;
            })
        }, {timeout: ms, timeoutMsg: "Timeout exception. Element " + selector + " still visible, timeout is " + ms});
    }

    waitUntilDisplayed(selector, ms) {
        return this.getBrowser().waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length > 0;
            })
        }, {timeout: ms, timeoutMsg: "Timeout exception. Element " + selector + " still not visible in: " + ms});
    }

    async waitForElementDisplayed(selector, ms) {
        let elements = await this.findElements(selector);
        let element = await this.findElement(selector);
        return await element.waitForDisplayed({timeout: ms});
    }

    waitForSpinnerNotVisible(ms) {
        let timeout;
        timeout = ms === undefined ? appConst.longTimeout : ms;
        let message = "Spinner still displayed! timeout is " + timeout;
        return this.browser.waitUntil(() => {
            return this.isElementNotDisplayed("//div[@class='spinner']");
        }, {timeout: timeout, timeoutMsg: message});
    }

    waitUntilElementNotVisible(selector, ms) {
        let message = "Element still displayed! timeout is " + appConst.longTimeout + "  " + selector;
        return this.browser.waitUntil(() => {
            return this.isElementNotDisplayed(selector);
        }, {timeout: ms, timeoutMsg: message});
    }

    isElementNotDisplayed(selector) {
        return this.getDisplayedElements(selector).then(result => {
            return result.length == 0;
        })
    }

    async getAttribute(selector, attributeName) {
        let element = await this.findElement(selector);
        return await element.getAttribute(attributeName);
    }

    async removeNotificationMessage() {
        try {
            let selector = "//div[contains(@id,'NotificationContainer')]//span[@class='notification-remove']";
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_remove_notif_msg"));
            throw new Error(err);
        }
    }

    async waitForNotificationMessage() {
        try {
            let notificationXpath = "//div[@class='notification-content']";
            await this.getBrowser().waitUntil(async () => {
                return await this.isElementDisplayed(notificationXpath);
            }, {timeout: appConst.longTimeout, timeoutMsg: 'Error when wait for notification message'});
            await this.pause(400);
            return await this.getText(notificationXpath);
        } catch (err) {
            throw new Error('Error when wait for the notification message: ' + err);
        }
    }

    //returns array of messages
    async waitForNotificationMessages() {
        try {
            await this.waitForElementDisplayed("//div[@class='notification-content']", appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_notification_messages');
            throw new Error('Error when wait for notification message: ' + err);
        }
        await this.pause(300);
        return await this.getTextInDisplayedElements(`//div[@class='notification-content']`);
    }

    waitForExpectedNotificationMessage(expectedMessage) {
        let selector = `//div[contains(@id,'NotificationMessage')]//div[contains(@class,'notification-content') and contains(.,'${expectedMessage}')]`;
        return this.waitForElementDisplayed(selector, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_notification_mess');
            throw new Error('expected notification message was not shown! ' + err);
        })
    }

    waitForErrorNotificationMessage() {
        let selector = `//div[contains(@id,'NotificationMessage') and @class='notification error']//div[contains(@class,'notification-content')]`;
        return this.waitForElementDisplayed(selector, appConst.mediumTimeout).then(() => {
            return this.getText(selector);
        })
    }

    async waitForNotificationWarning() {
        let selector = `//div[contains(@id,'NotificationMessage') and @class='notification warning']//div[contains(@class,'notification-content')]`;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getText(selector);
    }

    async doRightClick(selector) {
        let el = await this.findElement(selector);
        await el.moveTo();
        let x = await el.getLocation('x');
        let y = await el.getLocation('y');
        console.log("X:" + x + "Y " + y);
        return await this.browser.performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: {
                pointerType: 'mouse'
            },
            actions: [
                {type: "pointerMove", origin: "pointer", "x": Math.floor(x), "y": Math.floor(y)},
                {
                    type: 'pointerDown',
                    button: 2
                }, {
                    type: 'pointerUp',
                    button: 2
                }]
        }]);
    }

    async doTouchAction(selector) {
        let el = await this.findElement(selector);
        await el.moveTo();
        let x = await el.getLocation('x');
        let y = await el.getLocation('y');
        console.log("X:" + x + "Y " + y);
        return await this.browser.performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: {
                pointerType: 'touch'
            },
            actions: [
                {type: "pointerMove", origin: "pointer", "x": Math.floor(x), "y": Math.floor(y)},
                {type: 'pointerDown', button: 0}, {"type": "pause", "duration": 500},
                {type: 'pointerUp', button: 0}]
        }]);
    }

    async doRightClickWithOffset(selector, offsetX, offsetY) {
        let el = await this.findElement(selector);
        await el.moveTo();
        let xValue = await el.getLocation('x');
        let yValue = await el.getLocation('y');
        let y = parseInt(yValue) + offsetY;
        let x = parseInt(xValue) + offsetX;
        return await this.browser.performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: {
                pointerType: 'mouse'
            },
            actions: [
                {type: "pointerMove", origin: "pointer", "x": x, "y": y},
                {
                    type: 'pointerDown',
                    button: 2
                }, {
                    type: 'pointerUp',
                    button: 2
                }]
        }]);
    }

    async isFocused(selctor) {
        let el = await this.findElement(selctor);
        return await el.isFocused();
    }

    isAlertPresent() {
        return this.getBrowser().getAlertText().then(() => {
            return true;
        }).catch(err => {
            if (err.seleniumStack === undefined) {
                return false;
            }
            if (err.seleniumStack.type == 'NoAlertOpenError' || err.seleniumStack.type == 'NoSuchWindow') {
                return false
            } else {
                throw new Error(err);
            }
        })
    };

    alertAccept() {
        return this.getBrowser().acceptAlert();
    };

    getAlertText() {
        return this.getBrowser().getAlertText().catch(err => {
            if (err.seleniumStack.type == 'NoAlertOpenError') {
                throw new Error("Alert is not open " + err);
            } else {
                throw new Error(err);
            }
        })
    }

    async pressEscKey() {
        await this.keys('Escape');
        return await this.pause(500);
    }

    async pressEnterKey() {
        await this.keys('Enter');
        return await this.pause(400);
    }

    async switchToFrame(selector) {
        try {
            await this.waitUntilDisplayed(selector, appConst.shortTimeout);
            let el = await this.findElement(selector);
            //return await this.browser.switchToFrame(el.elementId); // Fail! Firefox and Chrome
            return await this.getBrowser().switchToFrame(el);
        } catch (err) {
            console.log('Error when switch to frame ' + selector);
            throw new Error('Error when switch to frame  ' + err);
        }
    }

    clickOnCloseBrowserTab() {
        return this.getBrowser().execute("window.close();");
    }

    execute(script) {
        return this.getBrowser().execute(script);
    }

    async doDoubleClick(selector) {
        try {
            let el = await this.findElement(selector);
            return await el.doubleClick();
        } catch (err) {
            throw Error('Error when doubleClick on the element' + err);
        }
    }

    switchToParentFrame() {
        return this.getBrowser().switchToParentFrame();
    }

    waitUntilInvalid(selector) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return result.includes('invalid');
            });
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Class should contain 'invalid' "});
    }

    waitForAttributeHasValue(selector, attribute, value) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, attribute).then(result => {
                return result.includes(value);
            });
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Attribute " + attribute + "  does not contain the value:" + value});
    }

    waitForAttributeNotIncludesValue(selector, attribute, value) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, attribute).then(result => {
                return !result.includes(value);
            });
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Attribute " + attribute + "  contains the value: " + value});
    }

    //is checkbox selected...
    async isSelected(selector) {
        let elems = await this.findElements(selector);
        return await elems[0].isSelected();
    }

    async isDisplayedElementSelected(selector) {
        let elems = await this.getDisplayedElements(selector);
        return await elems[0].isSelected();
    }

    refresh() {
        return this.getBrowser().refresh();
    }

    async scrollPanel(scrollTop) {
        let element = await this.findElement("//div[contains(@id,'Panel') and contains(@class,'panel-strip-scrollable')]");
        let id = await element.getAttribute("id");
        let script = "document.getElementById(arguments[0]).scrollTop=arguments[1]";
        await this.getBrowser().execute(script, id, scrollTop);
        return await this.pause(300);
    }

    async getCSSProperty(locator, property) {
        let elems = await this.findElements(locator);
        return await elems[0].getCSSProperty(property);

    }

    async isAlertOpen() {
        try {
            return await this.getBrowser().isAlertOpen();
        } catch (err) {
            await this.saveScreenshot("err_alert");
            return false;
        }
    }

    dismissAlert() {
        return this.getBrowser().dismissAlert();
    }
}

module.exports = Page;
