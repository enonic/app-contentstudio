/**
 * Created on 8.02.2018.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');

const XPATH = {
    metadataWizardTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='SEO Metadata']`,
    metadataStepForm: `//div[contains(@id,'MixinsWizardStepForm')]`,
    metadataTitleInputView: `//div[contains(@id,'InputView') and descendant::div[text()='Override "Title"']]`,
    metadataDescriptionInputView: `//div[contains(@id,'InputView') and descendant::div[text()='Override "Description"']]`,
};

class TestMetadataStepForm extends Page {

    get overrideTitleInput() {
        return lib.FORM_VIEW + XPATH.metadataTitleInputView + lib.TEXT_INPUT;
    }

    get overrideDescriptionTextArea() {
        return lib.FORM_VIEW + XPATH.metadataDescriptionInputView + lib.TEXT_AREA;
    }

    get descriptionValidationRecording() {
        return XPATH.metadataDescriptionInputView + lib.INPUT_VALIDATION_VIEW;
    }

    type(metadata) {
        return this.typeDescription(metadata.description).then(() => {
            return this.typeTitle(metadata.title);
        });
    }

    typeDescription(description) {
        return this.typeTextInInput(this.overrideDescriptionTextArea, description).catch(err => {
            this.saveScreenshot('err_metadata_description');
            throw new Error("Metadata Form , description" + err);
        })
    }

    typeTitle(title) {
        return this.typeTextInInput(this.overrideTitleInput, title).catch(err => {
            this.saveScreenshot('err_metadata_title');
            throw new Error("Metadata Form , Title" + err);
        })
    }

    async getDescriptionValidationRecording() {
        let recordingElements = await this.getDisplayedElements(this.descriptionValidationRecording);
        return await recordingElements[0].getText();
    }

    isOverrideTitleInputVisible() {
        return this.isElementDisplayed(this.overrideTitleInput);
    }

    isOverrideDescriptionTextAreaVisible() {
        return this.isElementDisplayed(this.overrideDescriptionTextArea);
    }

}

module.exports = TestMetadataStepForm;
