const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const path = require('path');

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

    async getDisplayedElements(selector) {
        let elements = await this.findElements(selector);
        let pr = elements.map(el => el.isDisplayed());
        return Promise.all(pr).then(result => {
            return elements.filter((el, i) => result[i]);
        });
    }

    pause(ms) {
        return this.browser.pause(ms);
    }

    async clickOnElement(selector) {
        let element = await this.findElement(selector);
        await element.waitForDisplayed(1500);
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

    async typeTextInInput(selector, text) {
        let inputElement = await this.findElement(selector);

        await inputElement.setValue(text);
        let value = await inputElement.getValue();
        //workaround for issue in WebdriverIO
        if (value == "") {
            await inputElement.setValue(text);
        }
        return await inputElement.pause(300);
    }

    async getTextInInput(selector) {
        let inputElement = await this.findElement(selector);
        return await inputElement.getValue(selector);
    }

    async clearInputText(selector) {
        let inputElement = await this.findElement(selector);
        await inputElement.waitForDisplayed(1000);
        await inputElement.clearValue();
        return await inputElement.pause(300);

    }

    saveScreenshot(name) {
        let screenshotsDir = path.join(__dirname, '/../build/screenshots/');
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
        return await el[0].waitForEnabled(ms);
    }

    async waitForDisplayedElementEnabled(selector, ms) {
        let el = await this.getDisplayedElements(selector);
        if (el.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (el.length === 0) {
            throw new Error("Element was not found:" + selector);
        }
        return await el[0].waitForEnabled(ms);
    }

    async waitForElementDisabled(selector, ms) {
        let element = await this.findElements(selector);
        if (element.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (element.length === 0) {
            throw new Error("Element was not found:" + selector);
        }
        return await element[0].waitForEnabled(ms, true);
    }

    async waitForDisplayedElementDisabled(selector, ms) {
        let element = await this.getDisplayedElements(selector);
        if (element.length > 1) {
            throw new Error("More than one element were found with the selector " + selector);
        }
        if (element.length === 0) {
            throw new Error("Element was not found:" + selector);
        }

        return await element[0].waitForEnabled(ms, true);
    }

    waitForElementNotDisplayed(selector, ms) {
        return this.getBrowser().waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length == 0;
            })
        }, ms).catch(err => {
            throw new Error("Timeout exception. Element " + selector + " still visible in: " + ms);
        });
    }

    waitUntilDisplayed(selector, ms) {
        return this.getBrowser().waitUntil(() => {
            return this.getDisplayedElements(selector).then(result => {
                return result.length > 0;
            })
        }, ms).catch(err => {
            throw new Error("Timeout exception. Element " + selector + " still not visible in: " + ms);
        });
    }

    async waitForElementDisplayed(selector, ms) {
        let element = await this.findElement(selector);
        return await element.waitForDisplayed(ms);
    }

    waitForSpinnerNotVisible() {
        let message = "Spinner still displayed! timeout is " + appConst.TIMEOUT_7;
        return this.browser.waitUntil(() => {
            return this.isElementNotDisplayed(`//div[@class='spinner']`);
        }, appConst.TIMEOUT_7, message);
    }

    waitUntilElementNotVisible(selector, timeout) {
        let message = "Element still displayed! timeout is " + appConst.TIMEOUT_7 + "  " + selector;
        return this.browser.waitUntil(() => {
            return this.isElementNotDisplayed(selector);
        }, timeout, message);
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

    waitForNotificationMessage() {
        let notificationXpath = `//div[@class='notification-content']/span`;
        return this.getBrowser().waitUntil(() => {
            return this.isElementDisplayed(notificationXpath);
        }).then(() => {
            return this.getTextInDisplayedElements(notificationXpath);
        }).then(result => {
            return result[0];
        }).catch(err => {
            throw new Error('Error when wait for notification message: ' + err);
        })
    }

    //returns array of messages
    waitForNotificationMessages() {
        return this.waitForElementDisplayed(`//div[@class='notification-content']/span`, appConst.TIMEOUT_3).catch(err => {
            throw new Error('Error when wait for notification message: ' + err);
        }).then(() => {
            return this.getTextInDisplayedElements(`//div[@class='notification-content']/span`);
        })
    }


    waitForExpectedNotificationMessage(expectedMessage) {
        let selector = `//div[contains(@id,'NotificationMessage')]//div[contains(@class,'notification-content')]//span[contains(.,'${expectedMessage}')]`;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_notification_mess');
            throw new Error('expected notification message was not shown! ' + err);
        })
    }

    waitForErrorNotificationMessage() {
        let selector = `//div[contains(@id,'NotificationMessage') and @class='notification error']//div[contains(@class,'notification-content')]/span`;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3).then(() => {
            return this.getText(selector);
        })
    }

    waitForNotificationWarning() {
        let selector = `//div[contains(@id,'NotificationMessage') and @class='notification warning']//div[contains(@class,'notification-content')]/span`;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3).then(() => {
            return this.getText(selector);
        })
    }

    async doRightClick(selector) {
        let el = await this.findElement(selector);
        await el.moveTo();
        return await this.browser.positionClick(2);
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

    pressEscKey() {
        return this.keys('Escape').then(() => {
            return this.pause(500);
        }).catch(err => {
            throw new Error('Error when clicking on Esc key ' + err);
        });
    }

    async switchToFrame(selector) {
        try {
            await this.waitUntilDisplayed(selector, appConst.TIMEOUT_2);
            let els = await this.findElements(selector);
            let el = await this.findElement(selector);
            //return await this.browser.switchToFrame(el.elementId); // Fail! Firefox and Chrome
            return await this.getBrowser().switchToFrame(el);
        } catch (err) {
            console.log('Error when switch to frame ' + selector);
            throw new Error('Error when switch to frame  ' + err);
        }
    }

    clickOnCloseIconInBrowser() {
        return this.getBrowser().execute("window.close();");
    }

    execute(script) {
        return this.getBrowser().execute(script);
    }

    async doDoubleClick(selector) {
        try {
            let el = await this.findElement(selector);
            await el.moveTo();
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
        }, 3000).catch(err => {
            return false;
        });
    }

    waitForAttributeHasValue(selector, attribute, value) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, attribute).then(result => {
                return result.includes(value);
            });
        }, appConst.TIMEOUT_2, "Attribute " + attribute + "  contains the value:" + value);
    }

    waitForAttributeNotIncludesValue(selector, attribute, value) {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, attribute).then(result => {
                return !result.includes(value);
            });
        }, appConst.TIMEOUT_2, "Attribute " + attribute + "  contains the value: " + value);
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
}

module.exports = Page;
