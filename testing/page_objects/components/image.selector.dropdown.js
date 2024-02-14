/**
 * Created on 08.01.2024
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ImageSelectorDropdown')]",
    flatModeListBoxUL:"//ul[contains(@id,'ImageContentListBox')]",
};

class ImageSelectorDropdown extends BasDropdown {

    get container(){
        return XPATH.container;
    }

    async selectFilteredImageInFlatMode(item, parentLocator) {
        try {
            // parentLocator = modal dialog or wizard panel...
            await this.clickOnFilteredItemAndClickOnOk( item, parentLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_img_selector_flat');
            throw new Error('Image selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    buildLocatorForOptionByDisplayName(optionDisplayName, parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        let containerUL = parentLocator + XPATH.flatModeListBoxUL;
        return lib.flatModeDropdownImgItemByDisplayName(containerUL, optionDisplayName);
    }

    // Click on images and select options in the expanded dropdown
    async clickOnImagesInDropdownList(numberOfImages){
        let locator = `//li[contains(@class,'item-view-wrapper') and descendant::h6[contains(@class,'main-name')]]//img`
        let elements = await this.findElements(locator).slice(0, numberOfImages);
        for (const el of elements) {
            await el.click();
            await this.pause(500);
        }
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
