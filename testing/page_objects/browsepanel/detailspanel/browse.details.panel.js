/**
 * Created on 04/07/2018.
 */
const Page = require('../../page');
const baseDetailsPanel = require('../../details_panel/base.details.panel');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'DockedContextPanel')]`,
    widgetSelectorDropdown: `//div[contains(@id,'WidgetSelectorDropdown')]`,

};

class BrowseDetailsPanel extends Page {

    get widgetSelectorDropdownHandle() {
        return xpath.container + xpath.widgetSelectorDropdown + lib.DROP_DOWN_HANDLE;
    }

    isPanelVisible() {
        return this.isElementDisplayed(xpath.container);
    }

    waitForDetailsPanelLoaded() {
        return this.waitForElementDisplayed(xpath.container, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Details Panel was not loaded in ' + appConst.TIMEOUT_2);
        });
    }

};
module.exports = BrowseDetailsPanel;

