/**
 * Created on 16.10.2024
 */
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const BaseDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ImageStyleSelector')]",
    styleListElement: style => {
        return `//li[contains(@class,'item-view-wrapper') and contains(.,'${style}')]`
    },
};

class ImageStyleSelectorDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async insertTextInOptionsFilterInput(text, parentLocator) {
        await this.filterItem(text, parentLocator);
    }

    async clickOnFilteredStyle(styleName, parentLocator) {
        try {
            // parentLocator = modal dialog
            await this.filterItem(styleName, parentLocator);
            await this.clickOnOptionByDisplayName(styleName)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_img_selector_flat');
            throw new Error(`Image selector - Error occurred during selecting the option, screenshot: ${screenshot} ` + err);
        }
    }

    // Click on a style and select option in the filtered dropdown
    async clickOnOptionByDisplayName(style) {
        let optionLocator = XPATH.container + XPATH.styleListElement(style);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        // Click on the style:
        await this.clickOnElement(optionLocator);
    }

    async getOptionsName() {
        let selector = XPATH.container + `//li[contains(@class,'item-view-wrapper')]`;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getTextInElements(selector);
    }
}

module.exports = ImageStyleSelectorDropdown;

