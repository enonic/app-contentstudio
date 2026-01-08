const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements-old');
const path = require('path');
const fs = require('fs');
const {Key} = require('webdriverio');
const {COMMON} = require('../libs/elements');

class Page {

    constructor() {
        if (typeof browser !== 'undefined') {
            this.browser = browser;
        } else {
            this.browser = webDriverHelper.browser;
        }
    }

    getBrowser() {
        return this.browser;
    }

    // value: string | string[]
    keys(value) {
        return this.browser.keys(value);
    }

    pressCtrl_A() {
        return this.browser.keys([Key.Ctrl, 'a']);
    }

    pressCtrl_C() {
        return this.browser.keys([Key.Ctrl, 'c']);
    }

    pressEndKey() {
        return this.browser.keys([Key.End]);
    }

    pressCtrl_V() {
        return this.browser.keys([Key.Ctrl, 'v']);
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

    async getDisplayedElements(selector) {
        let elements = await this.findElements(selector);
        if (elements.length === 0) {
            return [];
        }
        return await this.doFilterDisplayedElements(elements);
    }

    pause(ms) {
        return this.browser.pause(ms);
    }

    async doFilterDisplayedElements(elements) {
        let pr = await elements.map(async (el) => await el.isDisplayed());
        let result = await Promise.all(pr);
        return elements.filter((el, i) => result[i]);
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
        let results = [];
        let elements = await this.findElements(selector);
        if (elements.length === 0) {
            return [];
        }
        for (const item of elements) {
            results.push(await item.getText());
        }
        return results
    }

    async getTextInDisplayedElements(selector) {
        let results = [];
        let elements = await this.getDisplayedElements(selector);
        if (elements.length === 0) {
            return [];
        }
        for (const item of elements) {
            results.push(await item.getText());
        }
        return results;
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
            // workaround for issue in WebdriverIO
            if (value === "") {
                await inputElement.setValue(text);
            }
            return await this.pause(200);
        } catch (err) {
            throw new Error("Tried to set the value in the input " + err);
        }
    }

    async addTextInInput(selector, text) {
        let inputElement = await this.findElement(selector);
        //await inputElement.clearValue();
        await inputElement.addValue(text);
        await this.pause(300);
    }

    // Wait for an element for the provided amount of milliseconds to be present within the DOM. Returns true if the selector matches at least one
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
        return await inputElement.getValue();
    }

    async clearInputText(selector) {
        try {
            let inputElement = await this.findElement(selector);
            await inputElement.waitForDisplayed({timeout: 2000});
            await inputElement.clearValue();
            return await this.pause(1000);
        } catch (err) {
            throw new Error('Tried to clear the value in the input' + err);
        }
    }

    saveScreenshot(name) {
        let screenshotsDir = path.join(__dirname, '/../build/reports/screenshots/');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, {recursive: true});
        }
        return this.getBrowser().saveScreenshot(screenshotsDir + name + '.png').then(() => {
            console.log('screenshot is saved ' + name);
        }).catch(err => {
            console.log('screenshot was not saved ' + screenshotsDir + ' ' + err);
        })
    }

    async saveScreenshotUniqueName(namePart) {
        let screenshotName = appConst.generateRandomName(namePart);
        await this.saveScreenshot(screenshotName);
        return screenshotName;
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
            throw new Error('More than one element were found with the selector ' + selector);
        }
        if (el.length === 0) {
            throw new Error('Element was not found:' + selector);
        }
        return await el[0].waitForEnabled({timeout: ms});
    }

    async waitForElementDisabled(selector, ms) {
        let element = await this.findElements(selector);
        if (element.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (element.length === 0) {
            throw new Error('Element was not found:' + selector);
        }
        return await element[0].waitForEnabled({timeout: ms, reverse: true});
    }


    /**
     *  Return true if the selected DOM-element:
     *
     *     - exists
     *     - is visible
     *     - is within viewport (if not try scroll to it)
     *     - its center is not overlapped with another element
     *     - is not disabled
     *     otherwise exception will be thrown.
     */
    async waitForElementClickable(selector, ms) {
        let element = await this.findElements(selector);
        if (element.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (element.length === 0) {
            throw new Error('Element was not found:' + selector);
        }
        return await element[0].waitForClickable({timeout: ms});
    }

    async waitForElementNotClickable(selector, ms) {
        let element = await this.findElements(selector);
        if (element.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (element.length === 0) {
            throw new Error('Element was not found:' + selector);
        }
        return await element[0].waitForClickable({timeout: ms, reverse: true});
    }

    async waitForDisplayedElementDisabled(selector, ms) {
        let element = await this.getDisplayedElements(selector);
        if (element.length > 1) {
            throw new Error('More than one element were found with the selector ' + selector);
        }
        if (element.length === 0) {
            throw new Error('Element was not found:' + selector);
        }

        return await element[0].waitForEnabled({timeout: ms, reverse: true});
    }

    waitForElementNotDisplayed(selector, ms) {
        return this.getBrowser().waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length === 0;
            })
        }, {timeout: ms, timeoutMsg: 'Timeout exception. Element ' + selector + ' still visible, timeout is ' + ms});
    }

    waitUntilDisplayed(selector, ms) {
        return this.getBrowser().waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length > 0;
            })
        }, {timeout: ms, timeoutMsg: 'Timeout exception. Element ' + selector + ' still not visible in: ' + ms});
    }

    async waitForElementDisplayed(selector, ms) {
        let element = await this.findElement(selector);
        return await element.waitForDisplayed({timeout: ms});
    }

    async waitForSpinnerNotVisible(ms) {
        try {
            let timeout1;
            timeout1 = ms === undefined ? appConst.longTimeout : ms;
            let message = 'Spinner still displayed! timeout is ' + timeout1;
            return await this.browser.waitUntil(async () => {
                let res = await this.isElementNotDisplayed("//div[@class='spinner']");
                return res;
            }, {timeout: timeout1, timeoutMsg: message});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_spinner');
            throw new Error(` Spinner error, screenshot :${screenshot}  ` + err);
        }
    }

    waitUntilElementNotVisible(selector, ms) {
        let message = `Element still displayed! ${ms}  ` + selector;
        return this.browser.waitUntil(() => {
            return this.isElementNotDisplayed(selector);
        }, {timeout: ms, timeoutMsg: message});
    }

    async isElementNotDisplayed(selector) {
        let result = await this.getDisplayedElements(selector);
        return result.length === 0;
    }

    async getAttribute(selector, attributeName) {
        let element = await this.findElement(selector);
        return await element.getAttribute(attributeName);
    }

    async waitForAttributeIsPresent(elementLocator, attribute) {
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(elementLocator, attribute);
            return text != null;
        }, {timeout: appConst.shortTimeout, timeoutMsg: `Expected attribute ${attribute}  is not set in the element ${elementLocator}`});
    }

    async removeNotificationMessage() {
        try {
            let selector = "//div[contains(@id,'NotificationContainer')]//span[contains(@class,'notification-remove')]";
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_notif_msg');
            throw new Error(`Error after removing the notification message, screenshot:${screenshot} ` + err);
        }
    }

    async waitForNotificationMessage() {
        try {
            let notificationXpath = COMMON.NOTIFICATION_TEXT;
            await this.getBrowser().waitUntil(async () => {
                return await this.isElementDisplayed(notificationXpath);
            }, {timeout: appConst.longTimeout, timeoutMsg: 'The notification message was not shown'});
            await this.pause(100);
            return await this.getText(notificationXpath);
        } catch (err) {
            await this.handleError('Waited for the notification message', 'err_notif_msg', err);
        }
    }

    async waitForNotificationActionsText() {
        let locator = lib.DIV.NOTIFICATION_ACTIONS_DIV + "//a[@class='action']";
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementDisplayed(locator);
        }, {timeout: appConst.longTimeout, timeoutMsg: 'Error when wait for the notification message'});
        await this.pause(200);
        return await this.getText(locator);
    }

    //returns array of messages
    async waitForNotificationMessages() {
        try {
            await this.waitForElementDisplayed(lib.NOTIFICATION_TEXT, appConst.mediumTimeout);
            await this.pause(300);
            return await this.getTextInDisplayedElements(lib.NOTIFICATION_TEXT);
        } catch (err) {
            await this.handleError('Wait for notification messages - ', 'err_notification_messages', err);
        }
    }

    async waitForExpectedNotificationMessage(expectedMessage) {
        try {
            let selector = `//div[contains(@id,'NotificationMessage')]//div[contains(@class,'notification-text') and contains(.,'${expectedMessage}')]`;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_notification');
            throw new Error('expected notification message was not shown, screenshot: ' + screenshot + "  " + err);
        }
    }

    async doRightClick(selector) {
        let el = await this.findElement(selector);
        await el.moveTo();
        let x = await el.getLocation('x');
        let y = await el.getLocation('y');
        console.log('X:' + x + 'Y ' + y);
        return await this.browser.performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: {
                pointerType: 'mouse'
            },
            actions: [
                {type: 'pointerMove', origin: 'pointer', 'x': Math.floor(x), 'y': Math.floor(y)},
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
        return await this.doTouchActionOnElement(el);
    }

    async doTouchActionOnElement(el) {
        await el.moveTo();
        let x = await el.getLocation('x');
        let y = await el.getLocation('y');
        console.log('X:' + x + "Y " + y);
        return await this.browser.performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: {
                pointerType: 'touch'
            },
            actions: [
                {type: 'pointerMove', origin: 'pointer', 'x': Math.floor(x), 'y': Math.floor(y)},
                {type: 'pointerDown', button: 0}, {'type': 'pause', 'duration': 500},
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

    async doPerformMoveToAction(element, offsetX, offsetY) {
        await element.moveTo();
        let xValue = await element.getLocation('x');
        let yValue = await element.getLocation('y');
        let x = Math.floor(xValue);//parseInt(yValue) + offsetY;
        let y = Math.floor(yValue);// + offsetX;
        return await this.getBrowser().performActions([{
            type: 'pointer',
            id: 'pointer1',
            parameters: {
                pointerType: 'mouse'
            },
            actions: [
                {type: "pointerMove", origin: "pointer", "x": x, "y": y}]
        }]);
    }

    async holdDownShiftAndPressArrowDown(count) {
        // holding down the Shift key
        await this.getBrowser().performActions([{
            type: 'key',
            id: 'keyboard',
            actions: [
                { type: 'keyDown', value: Key.Shift }
            ]
        }]);

        // press ArrowDown key 'count' times
        for (let i = 1; i < count; i++) {
            await this.getBrowser().performActions([{
                type: 'key',
                id: 'keyboard',
                actions: [
                    { type: 'keyDown', value: Key.ArrowDown },
                    { type: 'keyUp', value: Key.ArrowDown  }
                ]
            }]);
            await this.getBrowser().pause(400);
        }

        await this.getBrowser().performActions([{
            type: 'key',
            id: 'keyboard',
            actions: [
                { type: 'keyUp', value: Key.Shift } // Shift
            ]
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

    async pressArrowDown() {
        await this.keys('ArrowDown');
        return await this.pause(400);
    }

    async pressArrowUp() {
        await this.keys('ArrowUp');
        return await this.pause(400);
    }

    async pressBackspace() {
        await this.keys('\uE003');
        return await this.pause(200);
    }

    async pressWhiteSpace() {
        await this.keys('\ue00D');
        return await this.pause(200);
    }

    async pressArrowLeft() {
        await this.keys('\ue012');
        return await this.pause(1000);
    }

    async pressArrowRight() {
        await this.keys('\ue014');
        return await this.pause(1000);
    }

    async switchToFrame(selector) {
        try {
            await this.waitUntilDisplayed(selector, appConst.mediumTimeout);
            let el = await this.findElement(selector);
            return await this.getBrowser().switchFrame(el);
        } catch (err) {
            await this.handleError('Tried to switch to the frame', 'err_switch_frame', err);
        }
    }

    clickOnCloseBrowserTab() {
        return this.getBrowser().execute('window.close();');
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

    // checks the attribute value (actual value contains expected value)
    waitForAttributeHasValue(selector, attribute, value) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, attribute).then(result => {
                return result.includes(value);
            });
        }, {timeout: appConst.shortTimeout, timeoutMsg: 'Attribute ' + attribute + '  does not contain the value:' + value});
    }

    waitForAttributeNotIncludesValue(selector, attribute, value) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, attribute).then(result => {
                return !result.includes(value);
            });
        }, {timeout: appConst.shortTimeout, timeoutMsg: 'Attribute ' + attribute + '  contains the value: ' + value});
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
        let script = 'document.getElementById(arguments[0]).scrollTop=arguments[1]';
        await this.getBrowser().execute(script, id, scrollTop);
        return await this.pause(900);
    }

    async getCSSProperty(locator, property) {
        let elems = await this.findElements(locator);
        return await elems[0].getCSSProperty(property);
    }

    async isAlertOpen() {
        try {
            return await this.getBrowser().isAlertOpen();
        } catch (err) {
            console.log(err);
            await this.saveScreenshot('err_alert');
            return false;
        }
    }

    dismissAlert() {
        return this.getBrowser().dismissAlert();
    }

    acceptAlert() {
        return this.getBrowser().acceptAlert();
    }

    async waitForLangAttribute(lang) {
        let locator = "//html";
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(locator, "lang");
            return text.includes(lang);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Html tag should contain 'lang' attribute"});
    }

    // checks the attribute value (actual value === expected value)
    async waitForAttributeValue(locator, attrName, expectedValue) {
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(locator, attrName);
            return text === expectedValue;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: `Expected attribute ${attrName} is not set in the element ${locator}`});
    }

    async getPuppeteer() {
        return await browser.getPuppeteer();
    }

    async getBrowserStatus() {
        return await this.getBrowser().status();
    }

    async performScrollWithWheelActions(element, deltaY) {
        await this.browser.performActions([
            {
                type: 'wheel',
                id: 'wheel1',
                actions: [
                    {
                        type: 'scroll',
                        origin: element,
                        x: 0,
                        y: 0,
                        deltaX: 0,  // horizontal scroll
                        deltaY: deltaY,
                    },
                ],
            },
        ]);
    }

    // Utility method for error handling
    async handleError(errorMessage, screenshotName, error) {
        if (Error.prototype.hasOwnProperty('cause')) {
            throw new Error(`${errorMessage}: ${error.message}  [screenshot]: ${screenshotName} `, {cause: error});
        }
        const wrapped = new Error(`${errorMessage}: ${error.message} `);
        wrapped.cause = error;
        wrapped.screenshotTaken = error.screenshotTaken;
        wrapped.screenshotName = error.screenshotName;

        if (!wrapped.screenshotTaken) {
            wrapped.screenshotName = screenshotName
            wrapped.screenshotTaken = true;
            wrapped.message += `[Screenshot]: ${screenshotName}`
            await this.saveScreenshotUniqueName(wrapped.screenshotName);
        }
        throw wrapped;
    }

    async isMacOS() {
        const status = await this.getBrowserStatus();
        return status.os.name.includes('Mac');
    }
}

module.exports = Page;
