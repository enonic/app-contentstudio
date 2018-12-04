/**
 * Created on 20.11.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');

const formXpath = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
};
const xDataImageSelector = Object.create(page, {

    imageOptionsFilterInput: {
        get: function () {
            return `${formXpath.container}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },

    filterOptionsAndSelectImage: {
        value: function (displayName) {
            return this.typeTextInInput(this.imageOptionsFilterInput, displayName).then(() => {
                return loaderComboBox.selectOption(displayName);
            });
        }
    },
    isImageSelected: {
        value: function () {
            let selector = formXpath.container + "//div[contains (@id,'ImageSelectorSelectedOptionView')]";
            return this.waitForVisible(selector, appConst.TIMEOUT_2);
        }
    }
});
module.exports = xDataImageSelector;
