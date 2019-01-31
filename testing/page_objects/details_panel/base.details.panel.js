/**
 * Created on 04/07/2018.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');


const baseDetailsPanel = Object.create(page, {

    //drop down menu for switch to Details, Version History, Dependencies
    clickOnWidgetSelectorDropdownHandle: {
        value: function () {
            return this.waitForVisible(this.widgetSelectorDropdownHandle, appConst.TIMEOUT_3).catch(err => {
                console.log("widget Selector DropdownHandle is not visible in  3 sec:");
                throw new Error('widgetSelectorDropdownHandle is not visible in  3 sec!  ' + err);
            }).pause(500).then(() => {
                return this.doClick(this.widgetSelectorDropdownHandle);
            });
        }
    },
//clicks on dropdown handle and select the 'Version History' menu item
    openVersionHistory: {
        value: function () {
            return this.clickOnWidgetSelectorDropdownHandle().then(() => {
                let versionHistoryOption = this.widgetSelectorDropdown + elements.itemByDisplayName(appConst.WIDGET_TITLE.VERSION_HISTORY);
                return this.waitForVisible(versionHistoryOption, appConst.TIMEOUT_2).catch(err => {
                    throw new Error("Details panel, version history option was not found in the dropdown selector " + err);
                }).then(() => {
                    return this.getDisplayedElements(versionHistoryOption);
                }).then(result => {
                    console.log('number of elements:  ' + result.length);
                    return this.getBrowser().elementIdClick(result[0].ELEMENT);
                });
            });
        }
    },
    //clicks on dropdown handle and select the 'Dependencies' menu item
    openDependencies: {
        value: function () {
            return this.clickOnWidgetSelectorDropdownHandle().catch(err => {
                this.saveScreenshot("err_dropdown_handle");
                throw new Error("Error when clicking on Drop Down Handler in dependencies panel " + err);
            }).then(() => {
                let dependenciesOption = this.widgetSelectorDropdown + elements.itemByDisplayName(appConst.WIDGET_TITLE.DEPENDENCIES);
                return this.waitForVisible(dependenciesOption, appConst.TIMEOUT_2).then(() => {
                    return this.getDisplayedElements(dependenciesOption)
                }).then(result => {
                    return this.getBrowser().elementIdClick(result[0].ELEMENT);
                });
            });
        }
    },
});
module.exports = baseDetailsPanel;


