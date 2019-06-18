/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

class BaseDetailsPanel extends Page {

    //drop down menu for switch to Details, Version History, Dependencies
    clickOnWidgetSelectorDropdownHandle() {
        return this.waitForElementDisplayed(this.widgetSelectorDropdownHandle, appConst.TIMEOUT_3).catch(err => {
            console.log("widget Selector DropdownHandle is not visible in  3 sec:");
            throw new Error('widgetSelectorDropdownHandle is not visible in  3 sec!  ' + err);
        }).then(()=>{
            return this.pause(300);
        }).then(() => {
            return this.clickOnElement(this.widgetSelectorDropdownHandle);
        });
    }

    //clicks on dropdown handle and select the 'Version History' menu item
    openVersionHistory() {
        return this.clickOnWidgetSelectorDropdownHandle().then(() => {
            let versionHistoryOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_TITLE.VERSION_HISTORY);
            return this.waitForElementDisplayed(versionHistoryOption, appConst.TIMEOUT_2).catch(err => {
                throw new Error("Details panel, version history option was not found in the dropdown selector " + err);
            }).then(() => {
                return this.getDisplayedElements(versionHistoryOption);
            }).then(result => {
                console.log('number of elements:  ' + result.length);
                return this.getBrowser().elementClick(result[0].ELEMENT);
            });
        });
    }

    //clicks on dropdown handle and select the 'Dependencies' menu item
    openDependencies() {
        return this.clickOnWidgetSelectorDropdownHandle().catch(err => {
            this.saveScreenshot("err_dropdown_handle");
            throw new Error("Error when clicking on Drop Down Handler in dependencies panel " + err);
        }).then(() => {
            let dependenciesOption = this.widgetSelectorDropdown + lib.itemByDisplayName(appConst.WIDGET_TITLE.DEPENDENCIES);
            return this.waitForElementDisplayed(dependenciesOption, appConst.TIMEOUT_2).then(() => {
                return this.getDisplayedElements(dependenciesOption)
            }).then(result => {
                return this.getBrowser().elementClick(result[0].ELEMENT);
            });
        });
    }
};
module.exports = BaseDetailsPanel;


