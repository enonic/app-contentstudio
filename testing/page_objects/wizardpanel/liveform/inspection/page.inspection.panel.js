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

    get customizePageButton() {
        return xpath.container + lib.actionButton('Customize Page');
    }

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
        try {
            await this.waitForSaveAsTemplateButtonDisplayed();
            await this.clickOnElement(this.saveAsTemplateButton);
            return await this.pause(3000);
        } catch (err) {
            await this.handleError('Page Inspection, tried to click on Save as Template button', 'err_click_save_as_template', err);
        }
    }

    async clickOnPageControllerDropdownHandle() {
        try {
            await this.clickOnElement(this.pageTemplateDropdownHandle);
            return await this.pause(700);
        } catch (err) {
            await this.handleError('Page Inspection, tried to click on page template dropdown handle', 'err_page_inspection_dropdown', err);
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
            await this.handleError('Page Inspection Panel, tried to select a option in controller-dropdown', 'err_select_option', err);
        }
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
    }

    async getSelectedPageController() {
        try {
            let locator = xpath.container + xpath.pageTemplateSelector + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Page Inspection Panel, selected controller in the controller-dropdown', 'err_selected_controller', err);
        }
    }

    waitForNotDisplayed() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.mediumTimeout);
    }

    async waitForPageTemplateAndControllerSelectorDisabled() {
        let locator = xpath.container + xpath.pageTemplateSelector;
        return this.waitForElementDisabled(locator, appConst.mediumTimeout);
    }

    async waitForCustomizeButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.customizePageButton, appConst.mediumTimeout);
    }

    async clickOnCustomizeButton() {
        try {
            await this.waitForElementDisplayed(this.customizePageButton, appConst.mediumTimeout);
            await this.clickOnElement(this.customizePageButton);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError('Page Inspection, tried to click on Customize button', 'err_click_customize', err);
        }
    }
}

module.exports = PageInspectionPanel;
