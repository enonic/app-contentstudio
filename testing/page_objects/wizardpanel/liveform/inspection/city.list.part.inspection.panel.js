/**
 * Created on 29.09.2023
 */
const PartInspectionPanel = require('./part.inspection.panel');
const {COMMON, DROPDOWN, BUTTONS} = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ContentSelectorDropdown = require('../../../components/selectors/content.selector.dropdown');

const xpath = {
    contentComboboxDiv: "//div[@data-component='ContentCombobox']",
    contentSelectionItemDisplayName: "//div[@data-component='ContentSelectionItem']//span[contains(@class,'font-semibold')]",
};

// Context Window, Inspect tab for City List Part Component
class CityListPartInspectionPanel extends PartInspectionPanel {

    get contentSelector() {
        return this.container + xpath.contentComboboxDiv;
    }

    get contentDropdownHandle() {
        return this.container + xpath.contentComboboxDiv + DROPDOWN.DROPDOWN_HANDLE;
    }

    get zoomLevelTextInput() {
        return this.container + COMMON.INPUTS.inputFieldByLabel('Zoom level 1-15') + "//input";
    }

    typeTextInZoomLevelInput(text) {
        return this.typeTextInInput(this.zoomLevelTextInput, text);
    }

    getTextInZoomLevelInput() {
        return this.getTextInInput(this.zoomLevelTextInput);
    }

    async selectContentInSelector(displayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown(this.container);
            return await contentSelectorDropdown.selectFilteredByDisplayNameContentMulti(displayName, this.container);
        } catch (err) {
            await this.handleError('City List Part Inspection Panel', 'err_select_content', err);
        }
    }

    async removeSelectedContent(displayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown(this.container);
            return await contentSelectorDropdown.removeContentSelectedOption(displayName);
        } catch (err) {
            await this.handleError('City List Part Inspection Panel, remove selected option', 'err_remove_selected_content', err);
        }
    }

    async clickOnContentDropdownHandle() {
        try {
            await this.waitForElementDisplayed(this.contentDropdownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.contentDropdownHandle);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_inspect_panel_dropdown');
            throw new Error(`Error during clicking on dropdown handle in content selector, screenshot: ${screenshot}` + err);
        }
    }

    async waitForLoaded() {
        try {
            return await this.waitForElementDisplayed(this.container);
        } catch (err) {
            await this.handleError('City List Part Inspection Panel, was not loaded', 'err_city_list_inspect_panel', err);
        }
    }

    async getSelectedContentDisplayName() {
        let locator = this.container + xpath.contentSelectionItemDisplayName;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = CityListPartInspectionPanel;
