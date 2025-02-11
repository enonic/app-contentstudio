/**
 * Created on 25.03.2022
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const xpath = {
    formOptionSetOccurrenceView: "//div[contains(@id,'FormOptionSetOccurrenceView')]",
    optionLabelLocator: option => `//div[contains(@id,'FormOptionSetOptionView') and descendant::span[text()='${option}']]//label`,
    optionCheckboxLocator:
        option => `//div[contains(@id,'FormOptionSetOptionView') and descendant::span[text()='${option}']]//input[@type='checkbox']`
};
//multi-select option set:
//Page Object for Custom option set
//This page can contain some checkboxes
class MultiSelectionOptionSet extends Page {

    async clickOnOption(option) {
        let locator = xpath.optionLabelLocator(option);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async isCheckboxSelected(option) {
        let locator = xpath.optionCheckboxLocator(option);
        return await this.isSelected(locator);
    }

    async waitForOptionCheckboxEnabled(option) {
        try {
            let locator = xpath.optionCheckboxLocator(option);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_multi_select_option"));
            throw new Error("Option Set multi selection: "+ err);
        }
    }

    async waitForOptionCheckboxDisabled(option) {
        try {
            let locator = xpath.optionCheckboxLocator(option);
            let element = await this.findElement(locator);
            //await element.scrollIntoView();
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementDisabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_multi_select"));
            throw new Error("Option Set multi selection: "+ err);
        }
    }
}

module.exports = MultiSelectionOptionSet;
