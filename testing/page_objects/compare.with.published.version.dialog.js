/**
 * Created  on 21.12.2022
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'CompareWithPublishedVersionDialog')]`,
    showEntireContent: "//div[contains(@id,'Checkbox') and child::label[text()='Show entire content']]",
    modifiedProperty: propertyName => `//li[contains(@class,'jsondiffpatch-modified') and child::div[contains(@class,'property-name') and contains(.,'${propertyName}')]]`,
    modifiedPropertyNewValue: propertyName => `//li[contains(@class,'jsondiffpatch-modified') and child::div[contains(@class,'property-name') and contains(.,'${propertyName}')]]//div[contains(@class,'right-value')]`,
    addedProperty: propertyName => `//li[contains(@class,'jsondiffpatch-added') and child::div[contains(@class,'property-name') and contains(.,'${propertyName}')]]`,
    addedPropertyNewValue: propertyName => `//li[contains(@class,'jsondiffpatch-added') and child::div[contains(@class,'property-name') and contains(.,'${propertyName}')]]//div[contains(@class,'jsondiffpatch-value')]`,
};

class CompareWithPublishedVersionDialog extends Page {

    get showEntireContent() {
        return XPATH.container + XPATH.showEntireContent + '//label';
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_compare_dlg');
            await this.saveScreenshot(screenshot);
            throw new Error("Compare With Published Version Dialog  is not loaded! , screenshot" + screenshot + '  ' + err);
        }
    }

    isDialogVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    async waitForDialogClosed() {
        await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        return await this.pause(100);
    }

    isWarningMessageVisible() {
        return this.isElementDisplayed(this.warningMessage);
    }

    getWarningMessage() {
        return this.getText(this.warningMessage)
    }

    clickOnNoButton() {
        return this.clickOnElement(this.noButton);
    }

    async waitForModifiedPropertyDisplayed(propertyName) {
        try {
            let locator = XPATH.container + XPATH.modifiedProperty(propertyName);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_published_prop');
            await this.saveScreenshot(screenshot);
            throw new Error('Compare with published version dialog - the property is not displayed, screenshot ' + screenshot + '  ' + err);
        }
    }

    async waitForModifiedWorkflowDisplayed() {
        try {
            let locator = XPATH.container + "//li[@data-key='workflow']";
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_published_prop');
            await this.saveScreenshot(screenshot);
            throw new Error('Compare with published version dialog - the property is not displayed, screenshot ' + screenshot + '  ' + err);
        }
    }

    async waitForAddedPropertyDisplayed(propertyName) {
        try {
            let locator = XPATH.container + XPATH.addedProperty(propertyName);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_published_prop');
            await this.saveScreenshot(screenshot);
            throw new Error('Compare with published version dialog - the property is not displayed, screenshot ' + screenshot + '  ' + err);
        }
    }

    async waitForAddedPropertyNotDisplayed(propertyName) {
        try {
            let locator = XPATH.container + XPATH.addedProperty(propertyName);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_published_prop');
            await this.saveScreenshot(screenshot);
            throw new Error('Compare with published version dialog - the property is  displayed, screenshot ' + screenshot + '  ' + err);
        }
    }

    async getValueInAddedProperty(propertyName) {
        try {
            let locator = XPATH.container + XPATH.addedPropertyNewValue(propertyName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_added_prop');
            await this.saveScreenshot(screenshot);
            throw new Error('Compare with published version dialog - the property is not displayed, screenshot ' + screenshot + '  ' + err);
        }
    }

    async getNewValueInModifiedProperty(propertyName) {
        try {
            let locator = XPATH.container + XPATH.modifiedPropertyNewValue(propertyName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_published_prop');
            await this.saveScreenshot(screenshot);
            throw new Error('Compare with published version dialog - the property is not displayed, screenshot ' + screenshot + '  ' + err);
        }
    }
}

module.exports = CompareWithPublishedVersionDialog;
