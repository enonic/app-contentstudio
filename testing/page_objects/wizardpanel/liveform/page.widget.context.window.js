/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'ContextView')]`,
    pageEditorExtensionDiv: "//div[@data-component='PageEditorExtension']",
    tabBarButtonByName: (name) => `//button[@role='tab' and child::span[text()='${name}']]`,
    // The selected tab gets aria-selected='true' and data-state='active'
    activeTabBarButtonByName: (name) =>
        `//button[@role='tab' and @aria-selected='true' and child::span[text()='${name}']]`,
};

class PageEditorExtension extends Page {
    async waitForTabBarItemDisplayed(tabName) {
        try {
            let selector = xpath.container + xpath.tabBarButtonByName(tabName);
            await this.waitForElementDisplayed(selector);
        } catch (err) {
            await this.handleError('Page Extension, Tab button was not found', 'err_page_widget_panel_tab', err);
        }
    }

    async clickOnTabBarItem(tabName) {
        try {
            let selector = xpath.container + xpath.tabBarButtonByName(tabName);
            await this.waitForTabBarItemDisplayed(tabName);
            let result = await this.getDisplayedElements(selector);
            await this.getBrowser().elementClick(result[0].elementId);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Page Extension, tried to click on the tab', 'err_click_tab_bar_item', err);
        }
    }

    // Waits for the tab with the given name to be the selected one:
    async waitForTabActive(tabName) {
        try {
            let selector = xpath.container + xpath.activeTabBarButtonByName(tabName);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Page Extension, '${tabName}' tab should be active`,
                'err_page_widget_panel_active_tab',
                err,
            );
        }
    }

    async waitForTabNotActive(tabName) {
        try {
            let selector = xpath.container + xpath.activeTabBarButtonByName(tabName);
            await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Page Extension, '${tabName}' tab should not be active`,
                'err_page_widget_panel_active_tab',
                err,
            );
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container);
        } catch (err) {
            await this.handleError(
                'Page Extension in context window was not loaded!',
                'err_page_widget_context_window',
                err,
            );
        }
    }
}

module.exports = PageEditorExtension;
