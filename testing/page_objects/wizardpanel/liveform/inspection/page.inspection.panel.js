/**
 * Created on 15.02.2018.
 */
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const InspectPanelControllerSelector = require('../../../../page_objects/components/selectors/inspect.panel.controller.selector');
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');

const xpath = {
    container: "//div[contains(@id,'PageInspectionPanel')]",
    pageTemplateSelector: `//div[contains(@id,'PageTemplateAndControllerSelector')]`,
    noControllerMessage: `//p[@class='no-controller-message']`,
};

// Inspect tab for controller and template of a Page
class PageInspectionPanel extends BaseComponentInspectionPanel {

    get customizePageButton() {
        return xpath.container + lib.actionButton('Customize Page');
    }

    get noControllerMessage() {
        return xpath.container + xpath.noControllerMessage;
    }

    get templateAndControllerOptionFilterInput() {
        return xpath.container + xpath.pageTemplateSelector + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get pageTemplateDropdownHandle() {
        return xpath.container + xpath.pageTemplateSelector + lib.DROP_DOWN_HANDLE;
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
            await this.handleError('Page Inspection Panel, tried to select a controller', 'err_select_option', err);
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

    async waitForCustomizePageButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.customizePageButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Page Inspection Tab, Customize button is still displayed', 'err_customize_button_displayed', err);
        }
    }

    async clickOnCustomizePageButton() {
        try {
            await this.waitForElementDisplayed(this.customizePageButton, appConst.mediumTimeout);
            await this.clickOnElement(this.customizePageButton);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError('Page Inspection, tried to click on Customize button', 'err_click_customize', err);
        }
    }

    async waitForCustomizePageButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.customizePageButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Page Inspection Tab, Customize button was not displayed', 'err_customize_button_not_displayed', err);
        }
    }

    async waitForCustomizePageButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.customizePageButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Page Inspection Tab, Customize button should be enabled', 'err_customize_button', err);
        }
    }

    async clickOnCustomizePageButton() {
        try {
            await this.waitForCustomizePageButtonEnabled();
            await this.clickOnElement(this.customizePageButton);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Page Inspection Tab, tried to click on Customize Page button', 'err_click_customize_button', err);
        }
    }

    async getNoControllerMessageText() {
        try {
            await this.waitForElementDisplayed(this.noControllerMessage, appConst.mediumTimeout);
            return await this.getText(this.noControllerMessage);
        } catch (err) {
            await this.handleError(`Page Inspection Tab, 'No page templates or page blocks available' - should be displayed`,
                'err_no_controller_message', err);
        }
    }
}

module.exports = PageInspectionPanel;
