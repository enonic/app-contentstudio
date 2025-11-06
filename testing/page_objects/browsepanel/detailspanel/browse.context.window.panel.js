/**
 * Created on 04/07/2018.
 */
const BaseContextWindowPanel = require('../../details_panel/base.context.window.panel');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'DockedContextPanel')]`,
};

class BrowseContextWindowPanel extends BaseContextWindowPanel {

    get container() {
        return xpath.container;
    }

    get widgetSelectorDropdownHandle() {
        return xpath.container + lib.DROPDOWN_SELECTOR.WIDGET_FILTER_DROPDOWN + lib.DROP_DOWN_HANDLE;
    }

    get widgetSelectorDropdown() {
        return xpath.container + lib.DROPDOWN_SELECTOR.WIDGET_FILTER_DROPDOWN;
    }

    isPanelVisible() {
        return this.isElementDisplayed(xpath.container);
    }

    async waitForDetailsPanelClosed() {
        try {
            await this.waitUntilElementNotVisible(xpath.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Browse Context Window Panel should be closed', 'err_context_window_panel', err);
        }
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout).catch(err => {
            throw new Error('Details Panel was not loaded in ' + err);
        });
    }

    waitForDetailsPanelCleared() {
        let selector = xpath.container + "//div[contains(@id,'ContextView')]";
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return result.includes('no-selection');
            })
        }, {timeout: appConst.shortTimeout, timeoutMsg: 'Browse Context Window should be cleared'});
    }

    async waitForWidgetDropdownRoleAttribute(expectedValue) {
        let locator = this.widgetSelectorDropdownHandle;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedValue);
    }
}

module.exports = BrowseContextWindowPanel;

