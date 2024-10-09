/**
 * Created on 20.11.2018.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ImageSelectorDropdown = require('../../components/selectors/image.selector.dropdown');

const XPATH = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
};

class XDataImageSelector extends Page {

    get imageOptionsFilterInput() {
        return XPATH.container + "//div[contains(@id,'ImageSelectorDropdown')]" + lib.OPTION_FILTER_INPUT;
    }

    async filterOptionsAndSelectImage(displayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.selectFilteredImageInFlatMode(displayName);
    }

    async clickOnImageSelectorModeTogglerButton() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.clickOnModeTogglerButton();
    }

    async waitForImageSelected() {
        let selector = XPATH.container + "//div[contains (@id,'ImageSelectorSelectedOptionView')]";
        return await this.waitForElementDisplayed(selector, appConst.shortTimeout);
    }

    waitForImageOptionsFilterInputVisible() {
        return this.waitForElementDisplayed(this.imageOptionsFilterInput, appConst.shortTimeout).catch(err => {
            throw new Error("x-data with Image Selector - image options filter input is not visible! " + err);
        });
    }
}

module.exports = XDataImageSelector;
