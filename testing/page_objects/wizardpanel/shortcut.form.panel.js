/**
 * Created on 02.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');

const shortcutForm = Object.create(page, {

    targetOptionsFilterInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${elements.CONTENT_SELECTOR}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    type: {
        value: function (shortcutData) {
            return this.filterOptionsAndSelectTarget(shortcutData.targetDisplayName);
        }
    },
    filterOptionsAndSelectTarget: {
        value: function (displayName) {
            return this.typeTextInInput(this.targetOptionsFilterInput, displayName).then(()=> {
                return loaderComboBox.selectOption(displayName);
            });
        }
    },
});
module.exports = shortcutForm;


