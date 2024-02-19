/**
 * Created on 08.01.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'ContentTreeSelectorDropdown')]",
    contentListBoxUL: "//ul[contains(@id,'ContentListBox')]",
    contentsTreeListUL: "//ul[contains(@id,'ContentsTreeList')]",
    contentListItemLI: "//li[contains(@class,'item-view-wrapper')]",
};

class ContentSelectorDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredContentAndClickOnOk(displayName, parent) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Content selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
    async getOptionsDisplayNameInTreeMode(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.contentsTreeListUL + XPATH.contentListItemLI + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsDisplayNameInFlatMode(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.contentListBoxUL + XPATH.contentListItemLI + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsName(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.contentListBoxUL + XPATH.contentListItemLI + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

}

module.exports = ContentSelectorDropdown;
