/**
 * Created on 17.03.2022
 */
const OptionSetFormView = require('./optionset.form.view');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    singleSelectionView: "//div[contains(@id,'FormOptionSetOccurrenceView') and contains(@class,'single-selection')]",
    dropDownDiv: "//div[contains(@id,'Dropdown')]",
    helpTextToggler: "//div[contains(@class,'help-text-toggler')]",
    inputInOption: inputLabel => `//div[contains(@id,'FormOptionSetOptionView') and descendant::div[@class='label' and text()='${inputLabel}']]`
};

class OptionSetHelpFormView extends OptionSetFormView {

    async clickOnHelpTextToggler(inputLabel) {
        try {
            let locator = xpath.inputInOption(inputLabel) + xpath.helpTextToggler;
            let res = await this.findElements(xpath.inputInOption(inputLabel));
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_help_text_toggler');
            throw new Error(`Error occurred in optionSet help-text toggler: ${err} \nScreenshot: ${screenshot}`);
        }
    }

    async getHelpText(inputLabel) {
        try {
            let locator = xpath.inputInOption(inputLabel) + "//div[@class='help-text visible']/p";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_help_text');
            throw new Error(`Error occurred in optionSet help-text: ${err} \nScreenshot: ${screenshot}`);
        }
    }
}

module.exports = OptionSetHelpFormView;
