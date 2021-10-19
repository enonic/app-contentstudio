/**
 * Created on 15.10.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'ComboBox')]",
    InputViewValidationDiv: "//div[contains(@id,'InputViewValidationViewer')]",
    optionByName: option => {
        return `//div[contains(@class,'slick-viewport')]//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${option}']`

    },
};

class ComboBoxFormPanel extends Page {

    get optionFilterInput() {
        return lib.CONTENT_WIZARD_STEP_FORM + XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get removeOptionIcon() {
        return lib.CONTENT_WIZARD_STEP_FORM + XPATH.container + lib.BASE_SELECTED_OPTION + lib.REMOVE_ICON;
    }

    async typeInFilterAndClickOnOption(option) {
        let optionLocator = XPATH.optionByName(option);
        await this.typeTextInInput(this.optionFilterInput, option);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
        return await this.pause(200);
    }

    async clickOnRemoveSelectedOptionButton(index) {
        let removeButtons = await this.getDisplayedElements(this.removeOptionIcon);
        if (removeButtons.length === 0) {
            throw new Error("ComboBox Form - Remove buttons were not found!");
        }
        await removeButtons[index].click();
        return await this.pause(500);
    }

    waitForOptionFilterInputEnabled() {
        return this.waitForElementEnabled(this.optionFilterInput, appConst.mediumTimeout);
    }

    waitForOptionFilterInputDisabled() {
        return this.waitForElementDisabled(this.optionFilterInput, appConst.mediumTimeout);
    }

    async getComboBoxValidationMessage() {
        let locator = lib.CONTENT_WIZARD_STEP_FORM + lib.FORM_VIEW + XPATH.InputViewValidationDiv;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getSelectedOptionValues() {
        let locator = lib.FORM_VIEW + "//div[@class='selected-option']//div[@class='option-value']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ComboBoxFormPanel;
