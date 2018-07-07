/**
 * Created on 09.03.2018
 */

var page = require('../page');
var elements = require('../../libs/elements');
var appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');

const form = {
    wizardStep: `//div[contains(@id,'ContentWizardStepForm')]`,
    supportsCombobox: `//div[contains(@id,'ContentTypeComboBox')]`,
    supportOptionFilterInput: "//div[contains(@id,'ContentTypeFilter')]//input[contains(@class,'option-filter-input')]",
    contentTypeSelectedOptionsView: "//div[contains(@id,'ContentTypeSelectedOptionsView')]",

}

var pageTemplateForm = Object.create(page, {

    supportOptionsFilterInput: {
        get: function () {
            return `${form.wizardStep}` + `${form.supportOptionFilterInput}`;
        }
    },
    type: {
        value: function (templateData) {
            return this.filterOptionsAndSelectSupport(templateData.supports);
        }
    },
    filterOptionsAndSelectSupport: {
        value: function (contentTypeDisplayName) {
            return this.typeTextInInput(this.supportOptionsFilterInput, contentTypeDisplayName).then(() => {
                return loaderComboBox.selectOption(contentTypeDisplayName);
            }).pause(500);
        }
    },
    clickOnRemoveSupportIcon: {
        value: function () {
            let selector = form.contentTypeSelectedOptionsView + elements.REMOVE_ICON;
            return this.doClick(selector).catch(err => {
                this.saveScreenshot('err_remove_support');
                throw new Error('error when clicking on remove-support icon ' + err);
            }).pause(1000);
        }
    }
});
module.exports = pageTemplateForm;


