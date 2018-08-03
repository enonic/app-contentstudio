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
                console.log("widget Selector DropdownHandle was not found:");
                throw new Error('widgetSelectorDropdownHandle was not found!  ' + err);
            }).then(() => {
                return this.doClick(this.widgetSelectorDropdownHandle);
            });
        }
    },
//clicks on dropdown handle and select the 'Version History' menu item
    openVersionHistory: {
        value: function () {
            return this.clickOnWidgetSelectorDropdownHandle().pause().then(() => {
                let versionHistoryOption = this.widgetSelectorDropdown + elements.VERSION_HISTORY_MENU_OPTION;
                return this.waitForVisible(versionHistoryOption, appConst.TIMEOUT_2).then(() => {
                    return this.getDisplayedElements(versionHistoryOption)
                }).then(result => {
                    console.log('number of elements:  '+result.length);
                    return this.getBrowser().elementIdClick(result[0].ELEMENT);
                });
            });
        }
    },
    //clicks on dropdown handle and select the 'Dependencies' menu item
    openDependencies: {
        value: function () {
            return this.clickOnWidgetSelectorDropdownHandle().pause().then(() => {
                let dependenciesOption = this.widgetSelectorDropdown + elements.DEPENDENCIES_MENU_OPTION;
                return this.waitForVisible(dependenciesOption, appConst.TIMEOUT_2).then(() => {
                    return this.getDisplayedElements(dependenciesOption)
                }).then(result => {
                    console.log('number of elements:  '+result.length);
                    return this.getBrowser().elementIdClick(result[0].ELEMENT);
                });
            });
        }
    },
});
module.exports = baseDetailsPanel;


