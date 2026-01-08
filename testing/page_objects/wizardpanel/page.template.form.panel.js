/**
 * Created on 09.03.2018
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const ContentTypeFilterDropdown = require('../components/selectors/content.type.filter.dropdown');

const XPATH = {
    wizardStep: `//div[contains(@id,'ContentWizardStepForm')]`,
    supportsComboboxDiv: `//div[contains(@id,'ContentTypeFilter')]`,
    supportOptionFilterInput: "//div[contains(@id,'ContentTypeFilter')]//input[contains(@class,'option-filter-input')]",
    contentTypeSelectedOptionsView: displayName => `//div[contains(@id,'ContentTypeSelectedOptionsView') and descendant::h6[text()='${displayName}']]`,
};

class PageTemplateForm extends Page {

    get supportOptionsFilterInput() {
        return XPATH.wizardStep + XPATH.supportOptionFilterInput;
    }

    type(templateData) {
        return this.filterOptionsAndSelectSupport(templateData.supports);
    }

    get formValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    async filterOptionsAndSelectSupport(contentTypeDisplayName) {
        let contentTypeFilterDropdown = new ContentTypeFilterDropdown();
        await contentTypeFilterDropdown.selectFilteredContentTypeAndClickOnApply(contentTypeDisplayName);
        return await this.pause(500);
    }
    async clickOnRemoveSupportIcon(displayName) {
        try {
            let selector = XPATH.contentTypeSelectedOptionsView(displayName) + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_remove_support');
            throw new Error('error when clicking on remove-support icon ' + err);
        }
    }

    async getSupportSelectedOptions() {
        let locator = XPATH.supportsComboboxDiv + "//div[contains(@id,'ContentTypeSelectedOptionsView')]" + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should be displayed"});
    }

    async getFormValidationRecording() {
        await this.waitForFormValidationRecordingDisplayed();
        let recordingElements = await this.getDisplayedElements(this.formValidationRecording);
        return await recordingElements[0].getText();
    }
}

module.exports = PageTemplateForm;

