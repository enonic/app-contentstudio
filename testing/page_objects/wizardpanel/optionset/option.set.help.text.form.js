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
        let locator = xpath.inputInOption(inputLabel) + xpath.helpTextToggler;
        let res= await this.findElements(xpath.inputInOption(inputLabel));
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    async getHelpText(inputLabel) {
        let locator = xpath.inputInOption(inputLabel) + "//div[@class='help-text visible']/p";
        return this.getText(locator);
    }


}

module.exports = OptionSetHelpFormView;
