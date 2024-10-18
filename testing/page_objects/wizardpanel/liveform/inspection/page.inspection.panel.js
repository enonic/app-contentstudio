/**
 * Created on 15.02.2018.
 */
const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const InspectPanelControllerSelector = require('../../../../page_objects/components/selectors/inspect.panel.controller.selector');

const xpath = {
    container: "//div[contains(@id,'InspectionsPanel')]",
    pageTemplateSelector: `//div[contains(@id,'PageTemplateAndControllerSelector')]`,
};

class PageInspectionPanel extends Page {

    get templateAndControllerOptionFilterInput() {
        return xpath.container + xpath.pageTemplateSelector + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get pageTemplateDropdownHandle() {
        return xpath.container + xpath.pageTemplateSelector + lib.DROP_DOWN_HANDLE;
    }

    get saveAsTemplateButton() {
        return xpath.container + lib.actionButton('Save as Template');
    }

    waitForSaveAsTemplateButtonDisplayed() {
        return this.waitForElementDisplayed(this.saveAsTemplateButton, appConst.mediumTimeout);
    }

    async clickOnSaveAsTemplateButton() {
        await this.waitForSaveAsTemplateButtonDisplayed();
        await this.clickOnElement(this.saveAsTemplateButton);
        return await this.pause(3000);
    }

    async clickOnPageControllerDropdownHandle() {
        try {
            await this.clickOnElement(this.pageTemplateDropdownHandle);
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_page_inspection_dropdown');
            throw new Error(`Error occurred in page template selector: screenshot:${screenshot} ` + err);
        }
    }

    async getOptionsNameInPageTemplateDropdown() {
        let inspectPanelControllerSelector = new InspectPanelControllerSelector();
        await inspectPanelControllerSelector.clickOnDropdownHandle(xpath.container);
        return await inspectPanelControllerSelector.getOptionsName(xpath.container);
    }

    async getOptionsDescriptionInPageTemplateDropdown() {
        let inspectPanelControllerSelector = new InspectPanelControllerSelector();
        await inspectPanelControllerSelector.clickOnDropdownHandle(xpath.container);
        return await inspectPanelControllerSelector.getOptionsDescription(xpath.container);
    }

    // clicks on dropdown handle and select an option
    async selectPageTemplateOrController(displayName) {
        try {
            let inspectPanelControllerSelector = new InspectPanelControllerSelector();
            await this.clickOnPageControllerDropdownHandle();
            await inspectPanelControllerSelector.clickOnOptionByDisplayName(displayName, xpath.container);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_option');
            throw new Error(`Error occurred in Page Inspection Panel, controller dropdown, screenshot: ${screenshot}` + err);
        }
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
    }

    async getSelectedPageController() {
        let locator = xpath.container + xpath.pageTemplateSelector + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForNotDisplayed() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.mediumTimeout);
    }
}

module.exports = PageInspectionPanel;
