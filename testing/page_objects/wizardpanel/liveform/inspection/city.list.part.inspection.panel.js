/**
 * Created on 29.09.2023
 */
const PartInspectionPanel = require('./part.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ContentSelectorDropdown = require('../../../components/selectors/content.selector.dropdown');

const xpath = {
    zoomLevelViewDiv: "//div[contains(@id,'InputView') and descendant::div[text()='Zoom level 1-15']]",
};

// Context Window, Inspect tab for City List Part Component
class CityListPartInspectionPanel extends PartInspectionPanel {

    get contentSelector() {
        return this.container + lib.CONTENT_SELECTOR.DIV;
    }

    get contentDropdownHandle() {
        return this.container + lib.CONTENT_SELECTOR.DIV + lib.DROP_DOWN_HANDLE;
    }

    get zoomLevelTextInput() {
        return this.container + xpath.zoomLevelViewDiv + lib.TEXT_INPUT;
    }

    typeTextInZoomLevelInput(text) {
        return this.typeTextInInput(this.zoomLevelTextInput, text);
    }

    getTextInZoomLevelInput() {
        return this.getTextInInput(this.zoomLevelTextInput);
    }

    async selectContentInSelector(displayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            return await contentSelectorDropdown.selectFilteredByDisplayNameContentMulti(displayName, xpath.container);
        } catch (err) {
            await this.handleError('City List Part Inspection Panel', 'err_select_content', err);
        }
    }

    async removeSelectedContent(displayName) {
        try {
            let locator = this.container + lib.CONTENT_SELECTOR.selectedOptionByName(displayName) + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            await this.pause(1000);
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
            let screenshot = await this.saveScreenshotUniqueName("err_inspect_panel_dropdown");
            throw new Error(`Error during clicking on dropdown handle in content selector, screenshot: ${screenshot}` + err);
        }
    }

    async waitForLoaded() {
        try {
            return await this.waitForElementDisplayed(this.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('City List Part Inspection Panel, was not loaded', 'err_city_list_inspect_panel', err);
        }
    }

    async getSelectedContentDisplayName() {
        let locator = this.container + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = CityListPartInspectionPanel;

