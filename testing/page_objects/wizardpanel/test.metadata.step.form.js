/**
 * Created on 8.02.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');

const XPATH = {
    metadataWizardTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='SEO Metadata']`,
    metadataStepForm: `//div[contains(@id,'XDataWizardStepForm') and descendant::div[text()='Override "Title"']]`,
};

class TestMetadataStepForm extends Page {

    get overrideTitleInput() {
        return XPATH.metadataStepForm + lib.FORM_VIEW + lib.TEXT_INPUT;
    }

    get overrideDescriptionTextArea() {
        return XPATH.metadataStepForm + lib.FORM_VIEW + lib.TEXT_AREA;
    }

    get descriptionErrorMessage() {
        return XPATH.metadataStepForm + lib.VALIDATION_RECORDING_VIEWER;
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

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.descriptionErrorMessage);
    }

    isOverrideTitleInputVisible() {
        return this.isElementDisplayed(this.overrideTitleInput);
    }

    isOverrideDescriptionTextAreaVisible() {
        return this.isElementDisplayed(this.overrideDescriptionTextArea);
    }

};
module.exports = TestMetadataStepForm;
