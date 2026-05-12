/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');


const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'ContextView')]`,
    pageEditorExtensionDiv: "//div[@data-component='PageEditorExtension']",
    tabBarButtonByName:
        name => `//button[@role='tab' and child::span[text()='${name}']]`,
};

class PageWidgetContextWindowPanel extends Page {

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

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container);
        } catch (err) {
            await this.handleError('Page Extension in context window was not loaded!', 'err_page_widget_context_window', err);
        }
    }
}

module.exports = PageWidgetContextWindowPanel;

