/**
 * Created on 23.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    checkboxDiv: "//div[contains(@id,'InputView')]//div[contains(@id,'Checkbox') and contains(@class,'checkbox')]",
    titleInput: `//input[contains(@name,'title')]`,
};

class CheckBoxForm extends Page {

    get checkbox() {
        return XPATH.checkboxDiv;
    }

    async clickOnCheckbox() {
        await this.waitForElementDisplayed(this.checkbox, appConst.mediumTimeout);
        return await this.clickOnElement(this.checkbox + "//label");
    }

    async isCheckBoxSelected() {
        await this.waitForElementDisplayed(this.checkbox + lib.CHECKBOX_INPUT, appConst.mediumTimeout);
        return await this.isSelected(this.checkbox + lib.CHECKBOX_INPUT);
    }

}

module.exports = CheckBoxForm;


