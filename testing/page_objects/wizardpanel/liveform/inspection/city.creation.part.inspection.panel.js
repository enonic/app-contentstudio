/**
 * Created on 08.11.2023
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const LoaderComboBox = require('../../../components/loader.combobox');
const ImageSelectorDropdown = require('../../../components/selectors/image.selector.dropdown');
const xpath = {
    container: `//div[contains(@id,'PartInspectionPanel')]`,
};

// Context Window, Inspect tab for City Creation Part Component
class CityCreationPartInspectionPanel extends BaseComponentInspectionPanel {

    get imageComboBoxDropdownHandle() {
        return xpath.container + lib.DROPDOWN_SELECTOR.IMAGE_CONTENT_COMBOBOX_DIV + lib.DROPDOWN_SELECTOR.DROPDOWN_HANDLE;
    }

    get imageSelectorModeTogglerButton() {
        return xpath.container + lib.DROPDOWN_SELECTOR.IMAGE_CONTENT_COMBOBOX_DIV + lib.DROPDOWN_SELECTOR.MODE_TOGGLER_BUTTON;
    }

    get imageSelectorOptionsFilterInput() {
        return xpath.container + lib.DROPDOWN_SELECTOR.IMAGE_CONTENT_COMBOBOX_DIV + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    async clickOnImageSelectorModeTogglerButton() {
        try {
            let imageSelectorDropdown = new ImageSelectorDropdown();
            await imageSelectorDropdown.clickOnModeTogglerButton(xpath.container);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_inspect_panel_mode_toggler');
            throw new Error("Inspect Panel, error after clicking on modeToggler in image selector, screenshot: " + screenshot + ' ' + err);
        }
    }

    async getTreeModeOptionsImagesDisplayName() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        return await imageSelectorDropdown.getOptionsDisplayNameInTreeMode(xpath.container);
    }


    async removeSelectedContent(displayName) {
        let locator = xpath.container + lib.CONTENT_SELECTOR.selectedOptionByName(displayName) + lib.REMOVE_ICON;
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
            let screenshot = await this.saveScreenshotUniqueName("err_inspect_panel_dropdown");
            throw new Error("Error during clicking on dropdown handle in image selector, screenshot: " + screenshot + ' ' + err);
        }
    }

    async waitForLoaded() {
        try {
            return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_load_inspect_panel');
            throw new Error('Live Edit, Part Inspection Panel is not loaded, screenshot:' + screenshot + ' ' + err);
        }
    }

    async getSelectedImageDisplayName() {
        let locator = xpath.container + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = CityCreationPartInspectionPanel;

