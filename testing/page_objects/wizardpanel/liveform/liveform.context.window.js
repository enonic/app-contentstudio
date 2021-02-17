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

    clickOnTabBarItem(name) {
        let selector = xpath.container + xpath.tabBarItemByName(name);
        return this.waitForElementDisplayed(selector).then(() => {
            return this.getDisplayedElements(selector);
        }).then(result => {
            return this.getBrowser().elementClick(result[0].elementId);
        }).catch(err => {
            this.saveScreenshot('err_click_on_inspection_link');
            throw new Error('clickOnContentType:' + err);
        }).then(() => {
            return this.pause(500);
        });
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_open_context_window');
            throw new Error('Live Edit, Context window is not opened' + err);
        });
    }
}
module.exports = LiveContextWindow;

