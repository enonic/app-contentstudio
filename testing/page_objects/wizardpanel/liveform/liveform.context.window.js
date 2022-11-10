/**
 * Created on 15.02.2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'ContextWindow')]`,
    insertTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='Insert']`,
    inspectTabBarItem: `//li[contains(@id,'TabBarItem') and child::a[text()='Inspect']]`,
    emulatorTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='Emulator']`,
    tabBarItemByName:
        name => `//li[contains(@id,'TabBarItem') and child::a[text()='${name}']]`,
};

class LiveContextWindow extends Page {

    get insertTabBarItem() {
        return xpath.container + xpath.insertTabBarItem;
    }

    async clickOnTabBarItem(tabName) {
        try {
            let selector = xpath.container + xpath.tabBarItemByName(tabName);
            await this.waitForElementDisplayed(selector);
            let result = await this.getDisplayedElements(selector);
            await this.getBrowser().elementClick(result[0].elementId);
            return await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_context_window');
            await this.saveScreenshot(screenshot);
            throw new Error('Error during clicking on tab bar item in Context Window, screenshot: ' + screenshot + "  " + err);
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_context_window')
            await this.saveScreenshot(screenshot);
            throw new Error('Live Edit, Context window is not opened, screenshot:' + screenshot + " " + err);
        }
    }
}

module.exports = LiveContextWindow;

