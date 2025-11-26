/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'ContextWindow')]`,
    insertTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='Insert']`,
    tabBarItemByName:
        name => `//li[contains(@id,'TabBarItem') and child::a[text()='${name}']]`,
};

//  div(context-container) for widgets in context window for Live Editor
// Insert tab and Inspect tab can be displayed on the panel
class PageWidgetContextWindowPanel extends Page {

    get insertTabBarItem() {
        return xpath.container + xpath.insertTabBarItem;
    }

    async waitForTabBarItemDisplayed(tabName) {
        try {
            let selector = xpath.container + xpath.tabBarItemByName(tabName);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Page Widget, TabBar item was not found', 'err_page_widget_panel_tab')
        }
    }
    async waitForTabBarItemNotDisplayed(tabName) {
        try {
            let selector = xpath.container + xpath.tabBarItemByName(tabName);
            await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Page Widget, TabBar item ${tabName} should not be displayed in the Page Widget`, 'err_page_widget_panel_tab')
        }
    }

    async clickOnTabBarItem(tabName) {
        try {
            let selector = xpath.container + xpath.tabBarItemByName(tabName);
            await this.waitForTabBarItemDisplayed(tabName);
            let result = await this.getDisplayedElements(selector);
            await this.getBrowser().elementClick(result[0].elementId);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Page widget, tried to click on the tab', 'err_click_tab_bar_item', err);
        }
    }

    async isTabBarItemActive(tabName){
        try {
            let locator = xpath.container + xpath.tabBarItemByName(tabName);
            let value =  await this.getAttribute(locator, 'class');
            return value.includes('active');
        } catch (err) {
            await this.handleError('Page widget, tried to check if tab is active', 'err_check_tab_bar_item_active', err);
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Page widget in context window was not loaded!', 'err_page_widget_context_window', err);
        }
    }
}

module.exports = PageWidgetContextWindowPanel;

