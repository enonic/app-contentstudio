/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const WidgetSelectorDropdown = require('../components/selectors/widget.selector.dropdown');
const PageWidgetContextWindowPanel = require('../wizardpanel/liveform/page.widget.context.window');
const {WIZARD, COMMON, DROPDOWN} = require('../../libs/elements');

const xpath = {
    scheduleWidgetItem: "//div[contains(@id,'OnlinePropertiesWidgetItemView')]",
};

class BaseContextWindowPanel extends Page {

    async waitForScheduleWidgetItemNotDisplayed() {
        return this.waitForElementNotDisplayed(xpath.scheduleWidgetItem, appConst.mediumTimeout);
    }

    async waitForScheduleWidgetItemDisplayed() {
        return this.waitForElementDisplayed(xpath.scheduleWidgetItem, appConst.mediumTimeout);
    }

    async getSelectedOptionInWidgetSelectorDropdown() {
        let selector = this.container + COMMON.CONTEXT_WINDOW_WIDGET_SELECTOR_ITEM;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getText(selector);
    }

    //drop down menu for switching to Components, Details, Version History, Dependencies
    async clickOnWidgetSelectorDropdownHandle() {
        try {
            await this.waitForWidgetSelectorDropDownHandleDisplayed();
            await this.clickOnElement(this.widgetSelectorDropdownHandle);
            await this.pause(300);
        } catch (err) {
            await this.handleError('Tried to click on Widget Selector dropdown handle.', 'err_widget_selector_dropdown_handle', err);
        }
    }

    async waitForWidgetSelectorDropDownHandleDisplayed() {
        try {
            await this.waitForElementDisplayed(this.widgetSelectorDropdownHandle, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Widget Selector dropdown handle is not displayed.', 'err_widget_selector_dropdown_handle_displayed',
                err);
        }
    }

    async clickOnWidgetSelectorDropdownOption(option) {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await this.clickOnWidgetSelectorDropdownHandle();
            await widgetSelectorDropdown.clickOnOptionByDisplayName(option);
            await this.pause(900);
        } catch (err) {
            await this.handleError(`Error occurred in widget selector dropdown, option ${option}`, 'err_click_widget_option', err);
        }
    }

    async waitForApplyButtonInWidgetSelectorNotDisplayed() {
        let widgetSelectorDropdown = new WidgetSelectorDropdown();
        return await widgetSelectorDropdown.waitForApplySelectionButtonNotDisplayed(this.container);
    }

    //clicks on dropdown handle and select the 'Version History' menu item
    async openVersionHistory() {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await this.clickOnWidgetSelectorDropdownHandle();
            await widgetSelectorDropdown.clickOnOptionByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.VERSION_HISTORY);
            await this.pause(900);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_open_versions');
            throw new Error(`Error occurred in widget selector dropdown, Version History, screenshot ${screenshot}: ` + err);
        }
    }

    // type Version History in Options filter input  then click on the filtered item
    // async filterAndOpenVersionHistory() {
    //     try {
    //         let widgetSelectorDropdown = new WidgetSelectorDropdown();
    //         // Expand the dropdown
    //         await widgetSelectorDropdown.clickOnDropdownHandle();
    //         // Insert the text in the options filter input:
    //         await widgetSelectorDropdown.selectFilteredWidgetItem(appConst.WIDGET_SELECTOR_OPTIONS.VERSION_HISTORY);
    //     } catch (err) {
    //         await this.handleError(`Widget selector dropdown - Tried to open Versions Widget `, 'err_open_versions', err);
    //     }
    // }

    async selectItemInWidgetSelector(itemName) {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await this.clickOnWidgetSelectorDropdownHandle();
            await widgetSelectorDropdown.clickOnOptionByDisplayName(itemName, this.container);
            await this.pause(300);
        } catch (err) {
            await this.handleError(`Widget selector dropdown - tried to open ${itemName} : `, 'err_open_widget', err);
        }
    }

    async openPageWidget() {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await this.clickOnWidgetSelectorDropdownHandle();
            await widgetSelectorDropdown.clickOnOptionByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await this.pause(300);
            return new PageWidgetContextWindowPanel();
        } catch (err) {
            await this.handleError(`Tried to open Page Widget. `, 'err_open_page_widget', err);
        }
    }

    getWidgetSelectorDropdownOptions() {
        let widgetSelectorDropdown = new WidgetSelectorDropdown();
        return widgetSelectorDropdown.getOptionsName();
    }

    //clicks on dropdown handle and select the 'Dependencies' menu item
    async openDependenciesWidget() {
        let widgetSelectorDropdown = new WidgetSelectorDropdown();
        await this.clickOnWidgetSelectorDropdownHandle();
        await widgetSelectorDropdown.clickOnOptionByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.DEPENDENCIES);
    }

    async openLayers() {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await this.clickOnWidgetSelectorDropdownHandle();
            await widgetSelectorDropdown.clickOnOptionByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.LAYERS);
        } catch (err) {
            await this.handleError('Tried to open Layers widget', 'err_open_layers_widget', err);
        }
    }

    async openDetailsWidget() {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            let option = await this.getSelectedOptionInWidgetSelectorDropdown();
            if (option !== 'Details') {
                await this.clickOnWidgetSelectorDropdownHandle();
                await widgetSelectorDropdown.clickOnOptionByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
            }
        } catch (err) {
            await this.handleError('Tried to open Details widget', 'err_open_details_widget', err);
        }
    }


    async getSelectedOptionsDisplayName() {
        let widgetSelectorDropdown = new WidgetSelectorDropdown();
        return await widgetSelectorDropdown.getSelectedOption();
    }

    getPanelWidth(width) {
        let value = width.substring(0, width.indexOf('px'));
        const parsed = Number(value);
        if (isNaN(parsed)) {
            return false;
        }
        return parsed;
    }

    async waitForWidgetSelected(optionName) {
        let selector = this.widgetSelectorDropdown + DROPDOWN.dropdownSelectedOptionByName('WidgetsSelectorItem', optionName);
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
    }
}

module.exports = BaseContextWindowPanel;
