/**
 * Created on 8.02.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');

const form = {
    metadataWizardTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='SEO Metadata']`,
    metadataStepForm: `//div[contains(@id,'XDataWizardStepForm') and descendant::div[text()='Override "Title"']]`,
}
var testMetadataStepForm = Object.create(page, {

    overrideTitleInput: {
        get: function () {
            return `${form.metadataStepForm}` + `${elements.FORM_VIEW}` + `${elements.TEXT_INPUT}`;
        }
    },
    overrideDescriptionTextArea: {
        get: function () {
            return `${form.metadataStepForm}` + `${elements.FORM_VIEW}` + `${elements.TEXT_AREA}`;
        }
    },
    descriptionErrorMessage: {
        get: function () {
            return `${form.metadataStepForm}` + `${elements.VALIDATION_RECORDING_VIEWER}`;
        }
    },
    type: {
        value: function (metadata) {
            return this.typeDescription(metadata.description).then(()=> {
                return this.typeTitle(metadata.title);
            });
        }
    },
    typeDescription: {
        value: function (description) {
            return this.typeTextInInput(this.overrideDescriptionTextArea, description).catch(err=> {
                this.doCatch('err_metadata_description', 'error when type text in the metadata-input');
            })
        }
    },
    typeTitle: {
        value: function (title) {
            return this.typeTextInInput(this.overrideTitleInput, title).catch(err=> {
                this.doCatch('err_metadata_title', 'error when type text in the metadata-input');
            })
        }
    },
    isValidationRecordingVisible: {
        value: function () {
            return this.isVisible(this.descriptionErrorMessage);
        }
    },
    isOverrideTitleInputVisible: {
        value: function () {
            return this.isVisible(this.overrideTitleInput);
        }
    },
    isOverrideDescriptionTextAreaVisible: {
        value: function () {
            return this.isVisible(this.overrideDescriptionTextArea);
        }
    },

});
module.exports = testMetadataStepForm;
