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
            await this.waitForElementDisplayed(this.widgetSelectorDropdownHandle, appConst.mediumTimeout);
            await this.pause(200);
            return await this.clickOnElement(this.widgetSelectorDropdownHandle);
        } catch (err) {
            throw new Error('Error when clicking on Widget Selector dropdown handle  ' + err);
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
            let versionHistoryOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_TITLE.VERSION_HISTORY);
            await this.waitForElementDisplayed(versionHistoryOption, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(versionHistoryOption);
            await elements[0].click();
            return await this.pause(200);
        } catch (err) {
            throw new Error("Error when opening Version History: " + err);
        }
    }

    //clicks on dropdown handle and select the 'Dependencies' menu item
    async openDependencies() {
        await this.clickOnWidgetSelectorDropdownHandle();
        let dependenciesOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_TITLE.DEPENDENCIES);
        await this.waitForElementDisplayed(dependenciesOption, appConst.mediumTimeout);
        let result = await this.getDisplayedElements(dependenciesOption);
        return await this.getBrowser().elementClick(result[0].elementId);
    }

    async openLayers() {
        try {
            await this.clickOnWidgetSelectorDropdownHandle();
            let layersOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_TITLE.LAYERS);
            await this.waitForElementDisplayed(layersOption, appConst.mediumTimeout);
            let result = await this.getDisplayedElements(layersOption);
            await result[0].click();
            return await this.pause(500);
        } catch (err) {
            throw new Error("Error when opening Layers widget" + err);
        }
    }
}

module.exports = BaseDetailsPanel;


