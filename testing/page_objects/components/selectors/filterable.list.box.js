/**
 * Created on 06.03.2024
 */
const BaseDropdown = require('../base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'FilterableListBoxWrapper')]",
    bucketListBoxUL: "//ul[contains(@id,'BucketListBox')]",
};

class FilterableListBox extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    // gets options name from the list box:
    async getOptionsDisplayName(parentLocator) {
        let locator = parentLocator + XPATH.bucketListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = FilterableListBox;
