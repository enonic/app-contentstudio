/**
 * Created on 15.02.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const pageInspectionPanel = require('./page.inspection.panel');
const xpath = {
    container: `//div[contains(@id,'ContextWindow')]`,
    insertTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='Insert']`,
    inspectTabBarItem: `//li[contains(@id,'TabBarItem') and child::a[text()='Inspect']]`,
    emulatorTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='Emulator']`,
    tabBarItemByName:
        name => `//li[contains(@id,'TabBarItem') and child::a[text()='${name}']]`,
};

const liveContextWindow = Object.create(page, {

    insertTabBarItem: {
        get: function () {
            return `${xpath.container}` + `${xpath.insertTabBarItem}`;
        }
    },
    clickOnTabBarItem: {
        value: function (name) {
            let selector = xpath.container + xpath.tabBarItemByName(name);
            return this.waitForVisible(selector).then(() => {
                return this.getDisplayedElements(selector);
            }).then((result) => {
                return this.getBrowser().elementIdClick(result[0].ELEMENT);
            }).catch(err => {
                this.saveScreenshot('err_click_on_inspection_link');
                throw new Error('clickOnContentType:' + err);
            }).pause(500);
        }
    },
    waitForOpened: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_load_context_window');
                throw new Error('Live Edit, Context window is not opened' + err);
            });
        }
    },
});
module.exports = liveContextWindow;
