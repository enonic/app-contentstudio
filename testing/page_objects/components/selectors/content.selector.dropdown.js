/**
 * Created on 08.01.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'ContentTreeSelectorDropdown')]",
    contentListBoxUL: "//ul[contains(@id,'ContentListBox')]",
    contentsTreeListUL: "//ul[contains(@id,'ContentsTreeList')]",
};

class ContentSelectorDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredByDisplayNameContent(displayName, parent) {
        try {
            // doesn't click on Apply - just click on the option:
            await this.clickOnFilteredByDisplayNameItem(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_content_selector_dropdown');
            throw new Error(`Content selector - Error during selecting the option, screenshot:${screenshot} ` + err);
        }
    }

    async selectFilteredByDisplayNameContentMulti(displayName, parent) {
        try {
            // Selects then clicks on Apply button:
            await this.clickOnFilteredByDisplayNameItemAndClickOnApply(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_content_selector_dropdown');
            throw new Error(`Content selector - Error during selecting the option, screenshot:${screenshot} ` + err);
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
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.contentsTreeListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsNameInTreeMode(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.contentsTreeListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsDisplayNameInFlatMode(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.contentListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsName(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.contentListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

}

module.exports = ContentSelectorDropdown;
