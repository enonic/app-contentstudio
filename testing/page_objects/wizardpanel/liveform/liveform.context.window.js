/**
 * Created on 15.02.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const pageInspectionPanel = require('./page.inspection.panel');
const panel = {
    container: `//div[contains(@id,'ContextWindow')]`,
    insertTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='Insert']`,
    inspectTabBarItem: `//li[contains(@id,'TabBarItem') and child::a[text()='Inspect']]`,
    emulatorTabBarItem: `//li[contains(@id,'TabBarItem')]/a[text()='Emulator']`,
};

const liveContextWindow = Object.create(page, {

    insertTabBarItem: {
        get: function () {
            return `${panel.container}` + `${panel.insertTabBarItem}`;
        }
    },
    inspectTabBarItem: {
        get: function () {
            return `${panel.container}` + `${panel.inspectTabBarItem}`;
        }
    },
    emulatorTabBarItem: {
        get: function () {
            return `${panel.container}` + `${panel.emulatorTabBarItem}`;
        }
    },
    clickOnInspectTabBarItem: {
        value: function () {
            return this.waitForVisible(this.inspectTabBarItem).then(() => {
                return this.getDisplayedElements(this.inspectTabBarItem);
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
            return this.waitForVisible(panel.container, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_load_context_window');
                throw new Error('Live Edit, Context window is not opened' + err);
            });
        }
    },
});
module.exports = liveContextWindow;
