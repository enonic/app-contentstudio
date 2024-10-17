/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const WidgetSelectorDropdown = require('../components/selectors/widget.selector.dropdown')

const xpath = {
    scheduleWidgetItem: "//div[contains(@id,'OnlinePropertiesWidgetItemView')]",
};

class BaseDetailsPanel extends Page {

    async waitForScheduleWidgetItemNotDisplayed() {
        return this.waitForElementNotDisplayed(xpath.scheduleWidgetItem, appConst.mediumTimeout);
    }

    async waitForScheduleWidgetItemDisplayed() {
        return this.waitForElementDisplayed(xpath.scheduleWidgetItem, appConst.mediumTimeout);
    }

    async getSelectedOptionInWidgetSelectorDropdown() {
        let selector = this.widgetSelectorDropdown + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getText(selector);
    }

    //drop down menu for switching to Components, Details, Version History, Dependencies
    async clickOnWidgetSelectorDropdownHandle() {
        try {
            await this.waitForWidgetSelectorDropDownHandleDisplayed();
            await this.pause(300);
            await this.clickOnElement(this.widgetSelectorDropdownHandle);
            await this.pause(700);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_widget_dropdown');
            throw new Error('Error when clicking on Widget Selector dropdown handle  ' + err);
        }
    }

    async waitForWidgetSelectorDropDownHandleDisplayed() {
        try {
            await this.waitForElementDisplayed(this.widgetSelectorDropdownHandle, appConst.mediumTimeout);
        } catch (err) {
            await this.refresh();
            await this.pause(2000);
            await this.waitForElementDisplayed(this.widgetSelectorDropdownHandle, appConst.shortTimeout);
        }
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
    async filterAndOpenVersionHistory() {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await widgetSelectorDropdown.clickOnDropdownHandle();
            await widgetSelectorDropdown.selectFilteredWidgetItem(appConst.WIDGET_SELECTOR_OPTIONS.VERSION_HISTORY);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_open_versions');
            throw new Error(`Error occurred in widget selector dropdown, Version History, screenshot ${screenshot}: ` + err);
        }
    }

    async selectItemInWidgetSelector(itemName) {
        let widgetSelectorDropdown = new WidgetSelectorDropdown();
        await this.clickOnWidgetSelectorDropdownHandle();
        await widgetSelectorDropdown.clickOnOptionByDisplayName(itemName);
    }

    getWidgetSelectorDropdownOptions() {
        let locator = this.widgetSelectorDropdown + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(locator);
    }

    //clicks on dropdown handle and select the 'Dependencies' menu item
    async openDependencies() {
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
            throw new Error("Error during opening 'Layers widget'" + err);
        }
    }

    async openDetailsWidget() {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await this.clickOnWidgetSelectorDropdownHandle();
            await widgetSelectorDropdown.clickOnOptionByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
        } catch (err) {
            throw new Error("Error occurred during opening 'Details widget'" + err);
        }
    }

    async clickOnEmulatorOptionsItem() {
        let widgetSelectorDropdown = new WidgetSelectorDropdown();
        await widgetSelectorDropdown.clickOnOptionByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.EMULATOR);
    }

    async openEmulatorWidget() {
        try {
            let widgetSelectorDropdown = new WidgetSelectorDropdown();
            await this.clickOnWidgetSelectorDropdownHandle();
            await this.clickOnEmulatorOptionsItem();
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_widget_selector'));
            await this.refresh();
            await this.pause(3000);
            await this.clickOnWidgetSelectorDropdownHandle();
            await this.clickOnEmulatorOptionsItem();
        }
    }
}

module.exports = BaseDetailsPanel;
