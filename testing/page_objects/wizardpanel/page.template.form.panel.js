/**
 * Created on 09.03.2018
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');

const XPATH = {
    wizardStep: `//div[contains(@id,'ContentWizardStepForm')]`,
    supportsCombobox: `//div[contains(@id,'ContentTypeComboBox')]`,
    supportOptionFilterInput: "//div[contains(@id,'ContentTypeFilter')]//input[contains(@class,'option-filter-input')]",
    contentTypeSelectedOptionsView: "//div[contains(@id,'ContentTypeSelectedOptionsView')]",
};

class PageTemplateForm extends Page {

    get supportOptionsFilterInput() {
        return XPATH.wizardStep + XPATH.supportOptionFilterInput;
    }

    type(templateData) {
        return this.filterOptionsAndSelectSupport(templateData.supports);
    }

    async filterOptionsAndSelectSupport(contentTypeDisplayName) {
        await this.typeTextInInput(this.supportOptionsFilterInput, contentTypeDisplayName);
        let loaderComboBox = new LoaderComboBox();
        await loaderComboBox.selectOption(contentTypeDisplayName);
        return this.pause(500);
    }

    clickOnRemoveSupportIcon() {
        let selector = XPATH.contentTypeSelectedOptionsView + lib.REMOVE_ICON;
        return this.clickOnElement(selector).catch(err => {
            this.saveScreenshot('err_remove_support');
            throw new Error('error when clicking on remove-support icon ' + err);
        }).then(() => {
            return this.pause(1000);
        });
    }

    async getSupportSelectedOptions() {
        let locator = XPATH.supportsCombobox + "//div[contains(@id,'ContentTypeSelectedOptionsView')]" + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = PageTemplateForm;

