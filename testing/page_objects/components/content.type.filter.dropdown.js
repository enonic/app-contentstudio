/**
 * Created on 08.01.2024
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ContentTypeFilterDropdown')]",
};

class ContentTypeFilterDropdown extends BasDropdown {

    get container(){
        return XPATH.container;
    }


    async selectFilteredContentTypeAndClickOnOk(item) {
        try {
            await this.clickOnFilteredItemAndClickOnOk( item);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Content type selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

}

module.exports = ContentTypeFilterDropdown;
