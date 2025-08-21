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
        try {
            let locator = XPATH.radioByName(label);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.clickOnElement(locator);
        }catch(err){
            await this.handleError(`Radio button with label "${label}" is not found.`,'err_click_on_radio', err);
        }
    }

    async isRadioSelected(label) {
        let locator = XPATH.radioByName(label);
        await this.waitForElementDisplayed(locator);
        return await this.isSelected(locator);
    }
}

module.exports = RadioButtonForm;
