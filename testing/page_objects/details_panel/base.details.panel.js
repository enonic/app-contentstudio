/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

class BaseDetailsPanel extends Page {

    //drop down menu for switch to Details, Version History, Dependencies
    clickOnWidgetSelectorDropdownHandle() {
        return this.waitForElementDisplayed(this.widgetSelectorDropdownHandle, appConst.mediumTimeout).catch(err => {
            console.log("widget Selector DropdownHandle is not visible in  3 sec:");
            throw new Error('widgetSelectorDropdownHandle is not visible in  3 sec!  ' + err);
        }).then(() => {
            return this.pause(300);
        }).then(() => {
            return this.clickOnElement(this.widgetSelectorDropdownHandle);
        });
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
        await this.clickOnWidgetSelectorDropdownHandle();
        let layersOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_TITLE.LAYERS);
        await this.waitForElementDisplayed(layersOption, appConst.mediumTimeout);
        let result = await this.getDisplayedElements(layersOption);
        await result[0].click();
        return await this.pause(500);
    }
};
module.exports = BaseDetailsPanel;


