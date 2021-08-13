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

    async clickOnModeTogglerButton() {
        await this.waitForModeTogglerDisplayed();
        await this.waitForElementEnabled(this.modeTogglerButton, appConst.mediumTimeout);
        await this.clickOnElement(this.modeTogglerButton);
        return await this.pause(700);
    }

    async getTreeModeOptionDisplayNames() {
        let options = XPATH.container + lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        try {
            await this.waitForElementDisplayed(options, appConst.mediumTimeout);
            return await this.getTextInElements(options)
        } catch (err) {
            await this.saveScreenshot('err_tree_mode_options');
            throw new Error("Content Selector treemode options : " + err);
        }
    }
}

module.exports = ContentSelector;
