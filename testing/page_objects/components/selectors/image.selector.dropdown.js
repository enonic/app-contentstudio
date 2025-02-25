/**
 * Created on 08.01.2024
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const BaseDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ImageSelectorDropdown')]",
    imageContentListBoxUL: "//ul[contains(@id,'ImageContentListBox')]",
    contentListElement: "//li[contains(@id,'ContentListElement')]",
    expanderIconByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'${name}')]]` +
               `//ancestor::li[contains(@id,'ContentListElement')]//div[contains(@class,'toggle icon-arrow_drop_up')]`;
    },
    imageByDisplayNameInTreeMode: displayName => {
        return lib.DROPDOWN_SELECTOR.CONTENTS_TREE_LIST_UL + lib.DROPDOWN_SELECTOR.OPTIONS_LI_ELEMENT +
               `//h6[contains(@class,'main-name') and contains(text(),'${displayName}')]`;
    }
};

class ImageSelectorDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async insertTextInOptionsFilterInput(text, parentLocator) {
        await this.filterItem(text, parentLocator);
    }

    async selectFilteredImageInFlatMode(imageDisplayName, parentLocator) {
        try {
            // parentLocator = modal dialog or wizard panel...
            await this.clickOnFilteredByDisplayNameItem(imageDisplayName, parentLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_img_selector_flat');
            throw new Error('Image selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    buildLocatorForOptionByDisplayName(optionDisplayName, parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        let containerUL = parentLocator + XPATH.imageContentListBoxUL;
        return lib.DROPDOWN_SELECTOR.flatModeDropdownImgItemByDisplayName(containerUL, optionDisplayName);
    }

    // Click on images and select options in the expanded dropdown(Flat-mode)
    async clickOnImagesInDropdownList(numberOfImages) {
        let locator = `//li[contains(@class,'item-view-wrapper') and descendant::h6[contains(@class,'main-name')]]//img`
        let elements = await this.findElements(locator).slice(0, numberOfImages);
        for (const el of elements) {
            await el.click();
            await this.pause(500);
        }
    }

    async clickOnImageInDropdownListTreeMode(imageDisplayName, parentLocator) {
        let locator = parentLocator + XPATH.imageByDisplayNameInTreeMode(imageDisplayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }


    // Gets all content-statuses in the expanded dropdown list
    async getImagesStatusInOptions() {
        let statusEl = XPATH.contentListElement + lib.H6_DISPLAY_NAME + "/following::div[contains(@class,'status')]";
        await this.waitForElementDisplayed(statusEl, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(statusEl);
    }

    // Gets content-status by displayName in the expanded dropdown list
    async getTreeModeContentStatus(displayName) {
        let statusEl = XPATH.contentListElement + lib.itemByDisplayName(displayName) + "/following::div[contains(@class,'status')][1]";
        await this.waitForElementDisplayed(statusEl, appConst.mediumTimeout);
        return await this.getTextInElements(statusEl);
    }

    async getImagesTitleAttribute(elements) {
        let titles = await elements.map(async (el) => await el.getAttribute("title"));
        await Promise.all(titles);
        return titles;
    }

    async scrollDownInDropdownList(parentXpath, deltaY) {
        const elementForScroll = await this.findElement(parentXpath + XPATH.imageContentListBoxUL);
        await this.performScrollWithWheelActions(elementForScroll, deltaY);
        await this.pause(1000);
    }

    async getOptionsDisplayNameInFlatMode(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.imageContentListBoxUL +
                      "//div[contains(@id,'ImageSelectorViewer') and contains(@class,'names-and-icon-viewer')]";
        await this.waitForElementDisplayed(parentXpath + XPATH.imageContentListBoxUL, appConst.mediumTimeout);
        let elements = await this.findElements(locator);
        return await this.getImagesTitleAttribute(elements);
    }

    async getOptionsDisplayNameInTreeMode(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + lib.DROPDOWN_SELECTOR.CONTENTS_TREE_LIST_UL + lib.DROPDOWN_SELECTOR.OPTIONS_LI_ELEMENT +
                      lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ImageSelectorDropdown;
