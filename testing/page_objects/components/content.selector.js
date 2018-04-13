/**
 * Created on 23.12.2017.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('./loader.combobox');

const component = {
    container: `//div[contains(@id,'ContentSelector')]`,
    modeTogglerButton: `//button[contains(@id,'ModeTogglerButton')]`,
    flatOptionView: `//div[contains(@id,'ImageSelectorViewer')]//img`,
};
const contentSelector = Object.create(loaderComboBox, {
    selectorDrppdownHandle: {
        get: function () {
            return `${component.container}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    modeTogglerButton: {
        get: function () {
            return `${component.container}` + `${component.modeTogglerButton}`;
        }
    },
    optionsFilterInput: {
        get: function () {
            return `${component.container}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    getMode: {
        value: function () {
            return this.getAttribute(this.modeTogglerButton, 'class').then((attr)=> {
                return attr.includes('active') ? 'tree' : 'flat';
            })
        }
    },
    waitForModeTogglerDisplayed: {
        value: function () {
            return this.waitForEnabled(this.modeTogglerButton, appConst.TIMEOUT_3).catch(err=> {
                this.saveScreenshot('err_content_selector_mode_toggler');
                throw new Error('content selector ' + err);
            });
        }
    },
    clickOnModeTogglerButton: {
        value: function () {
            return this.doClick(this.modeTogglerButton).catch(err=> {
                this.saveScreenshot('err_click_content_sel_toggler');
                throw  new Error('mode toggler not found ' + err);
            }).pause(1000);
        }
    },
    getTreeModeOptionDisplayNames: {
        value: function () {
            let options = `${component.container}` + `${elements.SLICK_VIEW_PORT}` + `${elements.H6_DISPLAY_NAME}`;
            return this.getTextFromElements(options).catch(err=> {
                throw new Error(err);
            });
        }
    }
});
module.exports = contentSelector;