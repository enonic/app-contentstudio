/**
 * Created on 08.01.2024
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BaseDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ImageSelectorDropdown')]",
    imageContentListBoxUL: "//ul[contains(@id,'ImageContentListBox')]",
    contentListElement: "//li[contains(@id,'ContentListElement')]",
    expanderIconByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'${name}')]]` +
               `//ancestor::li[contains(@id,'ContentListElement')]//div[contains(@class,'toggle icon-arrow_drop_up')]`;
    },
    expanderIconByDisplayName: displayName => {
        return `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]` +
               `//ancestor::li[contains(@id,'ContentListElement')]/div[contains(@class,'toggle icon-arrow_drop_up')]`;
    },
};

class ImageSelectorDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async insertTextInOptionsFilterInput(text, parentLocator) {
        await this.filterItem(text, parentLocator);
    }

    async selectFilteredImageInFlatMode(item, parentLocator) {
        try {
            // parentLocator = modal dialog or wizard panel...
            await this.clickOnFilteredItemAndClickOnOk(item, parentLocator);
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

    // Click on images and select options in the expanded dropdown
    async clickOnImagesInDropdownList(numberOfImages) {
        let locator = `//li[contains(@class,'item-view-wrapper') and descendant::h6[contains(@class,'main-name')]]//img`
        let elements = await this.findElements(locator).slice(0, numberOfImages);
        for (const el of elements) {
            await el.click();
            await this.pause(500);
        }
    }

    async clickOnOptionExpanderIcon(optionDisplayName) {
        let locator = XPATH.expanderIconByName(optionDisplayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async getImagesStatusInOptions() {
        let statusEl = XPATH.contentListElement + "//div[contains(@class,'status')]";
        await this.waitForElementDisplayed(statusEl, appConst.mediumTimeout);
        return await this.getTextInElements(statusEl);
    }

    async getOptionsDisplayNameInFlatMode(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.imageContentListBoxUL + lib.DROPDOWN_SELECTOR.IMG_DROPDOWN_OPT_DISPLAY_NAME_FLAT_MODE;
        await this.waitForElementDisplayed(parentXpath + XPATH.imageContentListBoxUL, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInElements(locator);
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

    // async selectFilteredImageInTreeMode(item) {
    //     try {
    //         await this.clickOnFilteredItemAndClickOnOk( item);
    //     } catch (err) {
    //         let screenshot = await this.saveScreenshotUniqueName('err_img_selector_tree');
    //         throw new Error('Image selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
    //     }
    // }
}

module.exports = ImageSelectorDropdown;
