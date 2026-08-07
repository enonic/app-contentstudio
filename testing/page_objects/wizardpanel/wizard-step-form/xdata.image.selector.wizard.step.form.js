/**
 * Created on 20.11.2018. updated on 07.08.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const { DROPDOWN } = require('../../../libs/elements');
const ImageSelectorDropdown = require('../../components/selectors/image.selector.dropdown');

const XPATH = {
    container: "//div[@data-component='Tab.Content' and contains(@id,'contenttypes:image-selector')]",
    imageSelector: "//div[@data-component='ImageSelector']",
    selectedImageItem:
        "//div[@data-component='SelectorSelectionItem' and descendant::div[@data-component='ImageSelectorItemView']]",
};

class XDataImageSelector extends Page {
    get imageOptionsFilterInput() {
        return XPATH.container + XPATH.imageSelector + DROPDOWN.OPTION_FILTER_DATA_COMPONENT;
    }

    async filterOptionsAndSelectImage(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.doFilterItem(displayName);
        await imageSelectorDropdown.selectFilteredImageInFlatMode(displayName);
    }

    async clickOnImageSelectorModeTogglerButton() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.clickOnModeTogglerButton();
    }

    async waitForImageSelected() {
        try {
            let locator = XPATH.container + XPATH.selectedImageItem;
            return await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(
                'x-data with Image Selector - selected image should be displayed',
                'err_xdata_image_selected',
                err,
            );
        }
    }

    async waitForImageOptionsFilterInputVisible() {
        try {
            return await this.waitForElementDisplayed(this.imageOptionsFilterInput, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(
                'x-data with Image Selector - options filter input should be visible',
                'err_xdata_image_filter_input',
                err,
            );
        }
    }
}

module.exports = XDataImageSelector;
