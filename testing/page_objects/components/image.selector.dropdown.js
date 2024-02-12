/**
 * Created on 08.01.2024
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ImageSelectorDropdown')]",
};

class ImageSelectorDropdown extends BasDropdown {

    get container(){
        return XPATH.container;
    }

    async selectFilteredImageInFlatMode(item) {
        try {
            await this.clickOnFilteredItemAndClickOnOk( item);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_img_selector_flat');
            throw new Error('Image selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
    async selectFilteredImageInTreeMode(item) {
        try {
            await this.clickOnFilteredItemAndClickOnOk( item);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_img_selector_tree');
            throw new Error('Image selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ImageSelectorDropdown;
