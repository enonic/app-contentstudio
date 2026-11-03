/**
 * Created on 04/07/2018.
 */
const BaseContextWindowPanel = require('../../details_panel/base.context.window.panel');
const { DROPDOWN } = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentBrowsePanel')]`,
};

class BrowseContextWindowPanel extends BaseContextWindowPanel {
    get container() {
        return xpath.container;
    }

    get widgetSelectorDropdownHandle() {
        return xpath.container + DROPDOWN.WIDGET_COMBOBOX + "//button[@aria-label='Toggle']";
    }

    get widgetSelectorDropdown() {
        return xpath.container + DROPDOWN.WIDGET_COMBOBOX;
    }

    async isPanelVisible() {
        return await this.isElementDisplayed(xpath.container + "//div[@data-component='ContextPanelView']");
    }

    async waitForDetailsPanelClosed() {
        try {
            await this.waitUntilElementNotVisible(xpath.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Browse Context Window Panel should be closed', 'err_context_window_panel', err);
        }
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout).catch((err) => {
            throw new Error('Details Panel was not loaded in ' + err);
        });
    }

    async waitForDetailsPanelCleared() {
        try {
            let selector =
                xpath.container + "//div[@data-component='ContextPanelView']//div[@data-component='PreviewLabel']";
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Browse Context Window should be cleared', 'err_context_window_cleared', err);
        }
    }

    async waitForWidgetDropdownRoleAttribute(expectedValue) {
        let locator = this.widgetSelectorDropdownHandle;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedValue);
    }
}

module.exports = BrowseContextWindowPanel;
