/**
 * Created on 23.12.2017.
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('./loader.combobox');
const XPATH = {
    container: `//div[contains(@id,'ContentSelector')]`,
    modeTogglerButton: `//button[contains(@id,'ModeTogglerButton')]`,
    flatOptionView: `//div[contains(@id,'ImageSelectorViewer')]//img`,
};

class ContentSelector extends LoaderComboBox {

    get selectorDrppdownHandle() {
        return XPATH.container + lib.DROP_DOWN_HANDLE;
    }

    get modeTogglerButton() {
        return XPATH.container + XPATH.modeTogglerButton;
    }

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    getMode() {
        return this.getAttribute(this.modeTogglerButton, 'class').then((attr) => {
            return attr.includes('active') ? 'tree' : 'flat';
        })
    }

    waitForModeTogglerDisplayed() {
        return this.waitForElementDisplayed(this.modeTogglerButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_content_selector_mode_toggler');
            throw new Error('content selector ' + err);
        });
    }

    clickOnModeTogglerButton() {
        return this.clickOnElement(this.modeTogglerButton).catch(err => {
            this.saveScreenshot('err_click_content_sel_toggler');
            throw  new Error('mode toggler not found ' + err);
        }).then(() => {
            return this.pause(1000);
        })
    }

    getTreeModeOptionDisplayNames() {
        let options = XPATH.container + lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(options).catch(err => {
            throw new Error(err);
        });
    }
};
module.exports = ContentSelector;