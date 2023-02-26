/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

class BaseDetailsPanel extends Page {

    //drop down menu for switch to Details, Version History, Dependencies
    async clickOnWidgetSelectorDropdownHandle() {
        try {
            await this.waitForWidgetSelectorDropDownHandleDisplayed();
            await this.pause(300);
            await this.clickOnElement(this.widgetSelectorDropdownHandle);
            await this.pause(1000);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_widget_dropdown'));
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

    async getOptionsName() {
        let locator = this.widgetSelectorDropdown + lib.DIV_GRID + "//div[contains(@id,'WidgetViewer')]" + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(locator);
    }

    //clicks on dropdown handle and select the 'Version History' menu item
    async openVersionHistory() {
        try {
            await this.clickOnWidgetSelectorDropdownHandle();
            let versionHistoryOption = this.widgetSelectorDropdown +
                                       lib.itemByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.VERSION_HISTORY);
            await this.waitForElementDisplayed(versionHistoryOption, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(versionHistoryOption);
            await elements[0].click();
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_open_versions'));
            throw new Error("Error when opening Version History: " + err);
        }
    }

    async selectItemInWidgetSelector(itemName) {
        await this.clickOnWidgetSelectorDropdownHandle();
        let option = this.widgetSelectorDropdown + lib.itemByDisplayName(itemName);
        await this.waitForElementDisplayed(option, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(option);
        await elements[0].click();
        return await this.pause(500);
    }

    getWidgetSelectorDropdownOptions() {
        let locator = this.widgetSelectorDropdown + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(locator);
    }

    //clicks on dropdown handle and select the 'Dependencies' menu item
    async openDependencies() {
        await this.clickOnWidgetSelectorDropdownHandle();
        let dependenciesOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.DEPENDENCIES);
        await this.waitForElementDisplayed(dependenciesOption, appConst.mediumTimeout);
        let result = await this.getDisplayedElements(dependenciesOption);
        await this.getBrowser().elementClick(result[0].elementId);
        return await this.pause(500);
    }

    async openLayers() {
        try {
            await this.clickOnWidgetSelectorDropdownHandle();
            let layersOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.LAYERS);
            await this.waitForElementDisplayed(layersOption, appConst.mediumTimeout);
            let result = await this.getDisplayedElements(layersOption);
            await result[0].click();
            return await this.pause(500);
        } catch (err) {
            throw new Error("Error when opening Layers widget" + err);
        }
    }

    async openDetails() {
        try {
            await this.clickOnWidgetSelectorDropdownHandle();
            let detailsOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
            await this.waitForElementDisplayed(detailsOption, appConst.mediumTimeout);
            let result = await this.getDisplayedElements(detailsOption);
            await result[0].click();
            return await this.pause(500);
        } catch (err) {
            throw new Error("Error during opening 'Details widget'" + err);
        }
    }

    async clickOnEmulatorOptionsItem() {
        let emulatorOptionLocator = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_SELECTOR_OPTIONS.EMULATOR);
        await this.waitForElementDisplayed(emulatorOptionLocator, appConst.mediumTimeout);
        let result = await this.getDisplayedElements(emulatorOptionLocator);
        await result[0].click();
        return await this.pause(500);
    }

    async openEmulatorWidget() {
        try {
            await this.clickOnWidgetSelectorDropdownHandle();
            await this.clickOnEmulatorOptionsItem();
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_widget_selector'));
            //throw new Error("Error when opening Emulator widget" + err);
            await this.refresh();
            await this.pause(5000);
            await this.clickOnWidgetSelectorDropdownHandle();
            await this.clickOnEmulatorOptionsItem();
        }
    }
}

module.exports = BaseDetailsPanel;


