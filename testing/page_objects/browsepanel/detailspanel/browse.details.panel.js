/**
 * Created on 04/07/2018.
 */
const page = require('../../page');
const baseDetailsPanel = require('../../details_panel/base.details.panel');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'DockedDetailsPanel')]`,
    widgetSelectorDropdown: `//div[contains(@id,'WidgetSelectorDropdown')]`,

};
const browseDetailsPanel = Object.create(baseDetailsPanel, {

    widgetSelectorDropdownHandle: {
        get: function () {
            return `${xpath.container}` + `${xpath.widgetSelectorDropdown}` + `${elements.DROP_DOWN_HANDLE}`;
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
module.exports = browseDetailsPanel;


