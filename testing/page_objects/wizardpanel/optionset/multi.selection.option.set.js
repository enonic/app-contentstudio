/**
 * Created on 25.03.2022
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='Multi selection']]",
    optionLabelLocator: option => `//div[@data-component='Checkbox' and descendant::span[text()='${option}']]//label`,
    optionCheckboxLocator: option => `//div[@data-component='Checkbox' and descendant::span[text()='${option}']]//input[@type='checkbox']`,
};

class MultiSelectionOptionSet extends Page {

    async clickOnOption(option) {
        let locator = xpath.container + xpath.optionLabelLocator(option);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async isCheckboxSelected(option) {
        let locator = xpath.container + xpath.optionCheckboxLocator(option);
        let attr = await this.getAttribute(locator, 'aria-checked');
        return attr === 'true';
    }

    async waitForOptionCheckboxEnabled(option) {
        try {
            let locator = xpath.container + xpath.optionCheckboxLocator(option);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_multi_select_option'));
            throw new Error('Option Set multi selection: ' + err);
        }
    }

    async waitForOptionCheckboxDisabled(option) {
        try {
            let locator = xpath.container + xpath.optionCheckboxLocator(option);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementDisabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_multi_select'));
            throw new Error('Option Set multi selection: ' + err);
        }
    }
}

module.exports = MultiSelectionOptionSet;
