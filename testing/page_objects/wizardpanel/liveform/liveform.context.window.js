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

class LiveContextWindow extends Page {

    get insertTabBarItem() {
        return xpath.container + xpath.insertTabBarItem;
    }

    async waitForTabBarItemDisplayed(tabName) {
        try {
            let selector = xpath.container + xpath.tabBarItemByName(tabName);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_context_window_tab');
            throw new Error("Context Window, TabBar item was not found, screenshot:" + screenshot + ' ' + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_context_window');
            throw new Error('Error during clicking on tab bar item in Context Window, screenshot: ' + screenshot + "  " + err);
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_context_window');
            throw new Error('Live Edit, Context window is not opened, screenshot:' + screenshot + " " + err);
        }
    }
}

module.exports = LiveContextWindow;

