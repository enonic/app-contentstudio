/**
 * Created on 01.12.2017.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const component = {
    container: `//div[contains(@id,'LoaderComboBox')]`,
    modeTogglerButton: `//button[contains(@id,'ModeTogglerButton')]`,
};
const loaderComboBox = Object.create(page, {
    optionsFilterInput: {
        get: function () {
            return `${component.container}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    selectOption: {
        value: function (optionDisplayName) {
            let optionSelector = elements.slickRowByDisplayName(`${component.container}`, optionDisplayName);
            return this.waitForVisible(optionSelector, appConst.TIMEOUT_3).catch(err => {
                throw new Error('option was not found! ' + optionDisplayName + ' ' + err);
            }).then(() => {
                return this.doClick(optionSelector).catch((err) => {
                    this.saveScreenshot('err_select_option');
                    throw new Error('option not found!' + optionDisplayName);
                })
            })
        }
    },
    typeTextAndSelectOption: {
        value: function (optionDisplayName, xpath) {
            let optionSelector = elements.slickRowByDisplayName(`${component.container}`, optionDisplayName);
            if (xpath === undefined) {
                xpath = '';
            }
            return this.getDisplayedElements(xpath + this.optionsFilterInput).then(result => {
                if (result.length == 0) {
                    throw new Error("Options Filter input is not visible! " + xpath + this.optionsFilterInput);
                }
                return this.getBrowser().elementIdValue(result[0].ELEMENT, optionDisplayName);
            }).pause(1000).then(() => {
                return this.doClick(optionSelector).catch((err) => {
                    this.saveScreenshot('err_clicking_on_option');
                    throw new Error('Error when clicking on the option in loadercombobox!' + optionDisplayName);
                }).pause(500);
            })
        }
    },
    getOptionDisplayNames: {
        value: function () {
            //TODO implement it 
        }
    }

});
module.exports = loaderComboBox;


