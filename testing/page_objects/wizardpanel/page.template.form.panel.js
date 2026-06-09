/**
 * Created on 09.03.2018
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentTypeFilterDropdown = require('../components/selectors/content.type.filter.dropdown');

const XPATH = {
    wizardStep: `//div[contains(@id,'ContentWizardTabs')]`,
    supportsComboboxDiv: `//div[contains(@id,'ContentTypeFilter')]`,
    supportOptionFilterInput: "//div[contains(@id,'ContentTypeFilter')]//input[contains(@class,'option-filter-input')]",
    contentTypeSelectedOptionsView: displayName => `//div[contains(@id,'ContentTypeSelectedOptionsView') and descendant::h6[text()='${displayName}']]`,
    selectedSupportOptionDisplayName:
        "//div[@data-component='SortableGridList']//div[@data-component='ItemLabel']//span[contains(@class,'font-semibold')]",
    selectedSupportOptionRow: displayName =>
        `//div[@data-component='SortableGridList']/div[descendant::span[contains(@class,'font-semibold') and text()='${displayName}']]`,
    // Remove (X) icon button inside a selected option row; its aria-label is empty, so match by the lucide-x svg:
    removeSupportIconButton:
        "//button[@data-component='IconButton' and descendant::*[contains(@class,'lucide-x')]]",
    // v6 validation message text span inside the FieldError component:
    fieldErrorText: "//div[@data-component='FieldError']//span",
};

class PageTemplateForm extends Page {

    type(templateData) {
        return this.filterOptionsAndSelectSupport(templateData.supports);
    }

    get formValidationRecording() {
        return XPATH.wizardStep + XPATH.fieldErrorText;
    }

    async filterOptionsAndSelectSupport(contentTypeDisplayName) {
        let contentTypeFilterDropdown = new ContentTypeFilterDropdown(XPATH.wizardStep);
        await contentTypeFilterDropdown.doFilterItem(contentTypeDisplayName);
        await contentTypeFilterDropdown.clickOnOptionByDisplayName(contentTypeDisplayName);
        await contentTypeFilterDropdown.clickOnApplySelectionButton();
        return await this.pause(500);
    }

    async clickOnRemoveSupportIcon(displayName) {
        try {
            let selector = XPATH.wizardStep + XPATH.selectedSupportOptionRow(displayName) + XPATH.removeSupportIconButton;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Page Template Form, error on clicking Remove support icon for "${displayName}": `,
                'err_click_remove_support', err);
        }
    }

    async getSupportSelectedOptions() {
        let locator = XPATH.wizardStep + XPATH.selectedSupportOptionDisplayName;
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

