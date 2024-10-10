/**
 * Created on 29.09.2023
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ContentSelectorDropdown = require('../../../components/selectors/content.selector.dropdown');
const xpath = {
    container: `//div[contains(@id,'PartInspectionPanel')]`,
    zoomLevelViewDiv: "//div[contains(@id,'InputView') and descendant::div[text()='Zoom level 1-15']]",
};

// Context Window, Inspect tab for City List Part Component
class CityListPartInspectionPanel extends BaseComponentInspectionPanel {

    get contentSelector() {
        return xpath.container + lib.CONTENT_SELECTOR.DIV;
    }

    get contentDropdownHandle() {
        return xpath.container + lib.CONTENT_SELECTOR.DIV + lib.DROP_DOWN_HANDLE;
    }

    get zoomLevelTextInput() {
        return xpath.container + xpath.zoomLevelViewDiv + lib.TEXT_INPUT;
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
            return await contentSelectorDropdown.selectFilteredContentAndClickOnOk(displayName, xpath.container);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_part_inspection');
            throw new Error("Part Inspection Panel - Error during selecting an option, screenshot: " + screenshot + "  " + err);
        }
    }

    async removeSelectedContent(displayName) {
        let locator = xpath.container + lib.CONTENT_SELECTOR.selectedOptionByName(displayName) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        await this.pause(1000);
    }

    async clickOnContentDropdownHandle() {
        try {
            await this.waitForElementDisplayed(this.contentDropdownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.contentDropdownHandle);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName("err_inspect_panel_dropdown");
            throw new Error("Error during clicking on dropdown handle in content selector, screensot: " + screenshot + ' ' + err);
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

    async getSelectedContentDisplayName() {
        let locator = xpath.container + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = CityListPartInspectionPanel;

