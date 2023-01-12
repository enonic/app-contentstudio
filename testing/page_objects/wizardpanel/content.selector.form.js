/**
 * Created on 09.07.2020.
 */

const lib = require('../../libs/elements');
const BaseSelectorForm = require('./base.selector.form');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'ContentSelector')]",
};

class ContentSelector extends BaseSelectorForm {

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get addNewContentButton() {
        return XPATH.container + lib.ADD_NEW_CONTENT_BUTTON;
    }

    selectedOptionByDisplayName(displayName) {
        return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`;
    }

    getSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(selector);
    }

    getNameSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]" + lib.P_SUB_NAME;
        return this.getTextInElements(selector);
    }

    async waitForAddNewContentButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.addNewContentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_add_new_btn');
            await this.saveScreenshot(screenshot);
            throw new Error('Add new button is not displayed, screenshot:' + screenshot + ' ' + err);
        }
    }

    async waitForAddNewContentButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.addNewContentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_add_new_btn');
            await this.saveScreenshot(screenshot);
            throw new Error('Add new button should not be displayed, screenshot:' + screenshot + ' ' + err);
        }
    }

    async clickOnAddNewContentButton() {
        await this.waitForAddNewContentButtonDisplayed();
        return await this.clickOnElement(this.addNewContentButton);
    }
}

module.exports = ContentSelector;
