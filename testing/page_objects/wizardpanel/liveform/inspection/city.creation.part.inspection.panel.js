/**
 * Created on 08.11.2023
 */
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ImageSelectorDropdown = require('../../../components/selectors/image.selector.dropdown');
const PartInspectionPanel = require('./part.inspection.panel');
const xpath = {
    container: `//div[contains(@id,'PartInspectionPanel')]`,
};

// Context Window, Inspect tab for City Creation Part Component
class CityCreationPartInspectionPanel extends PartInspectionPanel {

    get imageComboBoxDropdownHandle() {
        return this.container + lib.DROPDOWN_SELECTOR.IMAGE_CONTENT_COMBOBOX_DIV + lib.DROPDOWN_SELECTOR.DROPDOWN_HANDLE;
    }

    get imageSelectorModeToggleButton() {
        return this.container + lib.DROPDOWN_SELECTOR.IMAGE_CONTENT_COMBOBOX_DIV + lib.DROPDOWN_SELECTOR.MODE_TOGGLER_BUTTON;
    }

    get imageSelectorOptionsFilterInput() {
        return this.container + lib.DROPDOWN_SELECTOR.IMAGE_CONTENT_COMBOBOX_DIV + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    async clickOnImageSelectorModeTogglerButton() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown();
            await imageSelectorDropdown.clickOnModeTogglerButton(xpath.container);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('City Creation Part Inspection Panel', 'err_inspect_panel_selector_mode_toggle', err);
        }
    }

    async getTreeModeOptionsImagesDisplayName() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        return await imageSelectorDropdown.getOptionsDisplayNameInTreeMode(xpath.container);
    }


    async removeSelectedContent(displayName) {
        let locator = this.container + lib.CONTENT_SELECTOR.selectedOptionByName(displayName) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        await this.pause(1000);
    }

    async clickOnImageDropdownHandle() {
        try {
            await this.waitForElementDisplayed(this.imageComboBoxDropdownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.imageComboBoxDropdownHandle);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('City Creation Part Inspection Panel', 'err_inspect_panel_img_dropdown', err);
        }
    }

    async waitForLoaded() {
        try {
            return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('City Creation Part Inspection Panel', 'err_city_creation_part_inspect_panel', err);
        }
    }

    async getSelectedImageDisplayName() {
        let locator = this.container + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = CityCreationPartInspectionPanel;

