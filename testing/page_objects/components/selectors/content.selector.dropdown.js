/**
 * Created on 08.01.2024 updated on 11.02.2026
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const XPATH = {
    contentListBoxUL: "//ul[contains(@id,'ContentListBox')]",
    contentsTreeListUL: "//ul[contains(@id,'ContentsTreeList')]",
};

class ContentSelectorDropdown extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    // returns the element that contains the dropdown:
    get container() {
        return this._container;
    }


    get dataComponentDiv() {
        return "//div[contains(@data-component,'ContentCombobox')]";
    }


    // selects a tree option by display name .
    async selectFilteredByDisplayNameContent(userDisplayName) {
        try {
            await this.doFilterItem(userDisplayName);
            await this.clickOnFilteredByDisplayNameTreeOption(userDisplayName);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`Content selector, tried to click on the filtered option, ${userDisplayName} `, 'err_content_sel', err);
        }
    }

    // async selectFilteredByDisplayNameContent(displayName, parent) {
    //     try {
    //         // doesn't click on Apply - just click on the option:
    //         await this.clickOnFilteredByDisplayNameItem(displayName, parent);
    //     } catch (err) {
    //         await this.handleError(`Content selector - Error during selecting the option`, 'err_content_selector_dropdown', err);
    //     }
    // }

    async selectFilteredByDisplayNameContentMulti(displayName, parent) {
        try {
            // Selects then clicks on Apply button:
            await this.clickOnFilteredByDisplayNameItemAndClickOnApply(displayName, parent);
        } catch (err) {
            await this.handleError(`Content selector - Error during selecting the option`, 'err_content_selector_dropdown', err);
        }
    }

    async selectFilteredByNameContent(name, parent) {
        try {
            await this.clickOnFilteredByNameItem(name, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error(`Content selector - Error during selecting the option, screenshot:${screenshot} ` + err);
        }
    }

    async getOptionsDisplayNameInTreeMode(parentXpath) {
        let locator =  XPATH.contentsTreeListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsNameInTreeMode(parentXpath) {
        let locator =  XPATH.contentsTreeListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsDisplayNameInFlatMode() {

        let locator =  XPATH.contentListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsName(parentXpath) {
        let locator =  XPATH.contentListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ContentSelectorDropdown;
