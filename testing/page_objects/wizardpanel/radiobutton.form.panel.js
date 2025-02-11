/**
 * Created on 07.09.2021
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const XPATH = {
    radioInputs: "//div[contains(@id,'RadioButton')]//input[@type='radio']",
    radioByName: optionName => {
        return `//span[contains(@class,'radio-button') and descendant::span[text()='${optionName}']]//input`
    },
};

class RadioButtonForm extends Page {

    async clickOnRadio(label) {
        let locator = XPATH.radioByName(label);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
    }

    async isRadioSelected(label) {
        let locator = XPATH.radioByName(label);
        await this.waitForElementDisplayed(locator);
        return await this.isSelected(locator);
    }
}

module.exports = RadioButtonForm;
