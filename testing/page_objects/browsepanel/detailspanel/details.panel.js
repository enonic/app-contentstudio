/**
 * Created on 04/07/2018.
 */
const page = require('../../page');
const saveBeforeCloseDialog = require('../../save.before.close.dialog');
const contentDuplicateDialog = require('../../content.duplicate.dialog');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'DockedDetailsPanel')]`,
    widgetSelectorDropdown: `//div[contains(@id,'WidgetSelectorDropdown')]`,

}
var detailsPanel = Object.create(page, {

    widgetSelectorDropdownHandle: {
        get: function () {
            return `${xpath.container}` + `${xpath.widgetSelectorDropdown}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    clickOnwidgetSelectorDropdownHandle: {
        value: function () {
            return this.waitForVisible(this.widgetSelectorDropdownHandle, appConst.TIMEOUT_3).catch(err => {
                console.log("widget Selector DropdownHandle was not found:");
                throw new Error('widgetSelectorDropdownHandle was not found!  ' + err);
            }).then(() => {
                return this.doClick(this.widgetSelectorDropdownHandle);
            });
        }
    },
    isPanelVisible: {
        value: function () {
            return this.isVisible(xpath.container);
        }
    },
    waitForDetailsPanelLoaded: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Details Panel was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
});
module.exports = detailsPanel;


