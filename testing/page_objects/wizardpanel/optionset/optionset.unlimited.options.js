/**
 * Created on 24.05.2021.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const xpath = {
    formOptionSetOccurrenceView: "//div[contains(@id,'FormOptionSetOccurrenceView')]",
    optionLabelLocator: option => `//div[contains(@id,'FormOptionSetOptionView') and descendant::label[text()='${option}']]//label`,
    optionCheckboxLocator:
        option => `//div[contains(@id,'FormOptionSetOptionView') and descendant::label[text()='${option}']]//input[@type='checkbox']`
};

class OptionSetUnlimitedOptions extends Page {

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
}

module.exports = OptionSetUnlimitedOptions;
