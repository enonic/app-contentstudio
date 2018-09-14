/**
 * Created on 28.03.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const xpath = {
    container: "//div[contains(@id,'PageComponentsView')]",
    pageComponentsItemViewer: "//div[contains(@id,'PageComponentsItemViewer')]",
    pageComponentsTreeGrid: `//div[contains(@id,'PageComponentsTreeGrid')]`,
    contextMenuItemByName: function (name) {
        return `//dl[contains(@id,'TreeContextMenu')]//*[contains(@id,'TreeMenuItem') and text()='${name}']`;
    },
    componentByName: function (name) {
        return `//div[contains(@id,'PageComponentsItemViewer') and descendant::h6[contains(@class,'main-name')  and text()='${name}']]`
    },
};

const pageComponentView = Object.create(page, {

    openMenu: {
        value: function (componentName) {
            let menuButton = xpath.componentByName(componentName) + "/../..//div[@class='menu-icon']";
            return this.waitForVisible(menuButton, appConst.TIMEOUT_2).then(() => {
                return this.doClick(menuButton);
            }).pause(500).catch(err => {
                this.saveScreenshot('err_component_view');
                throw new Error('Error when clicking on `Menu button`: ' + err);
            });
        }
    },
    isMenuItemPresent: {
        value: function (name) {
            let selector = xpath.contextMenuItemByName(name);
            return this.waitForVisible(selector, appConst.TIMEOUT_2).catch(err => {
                console.log(err);
                return false;
            })
        }
    },
    //example: clicks on Insert/Image menu items
    selectMenuItem: {
        value: function (items) {
            let result = Promise.resolve();
            items.forEach(menuItem => {
                result = result.then(() => this.clickOnMenuItem(menuItem));
            });
            return result;
        }
    },
    clickOnMenuItem: {
        value: function (menuItem) {
            let selector = xpath.contextMenuItemByName(menuItem);
            return this.waitForVisible(selector, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot("err_menu_item");
                throw new Error("Page Component View: Menu Item still not visible - " + menuItem)
            }).then(() => {
                return this.doClick(selector).pause(500);
            });
        }
    },

    waitForOpened: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2);
        }
    },
    swapComponents: {
        value: function (sourceName, destinationName) {
            let sourceElem = xpath.container + xpath.componentByName(sourceName);
            let destinationElem = xpath.container + xpath.componentByName(destinationName);
            return this.getBrowser().dragAndDrop(sourceElem, destinationElem).pause(3000).then(() => {
                //return this.getBrowser().moveToObject(sourceElem)
            }).then(() => {
                //return this.getBrowser().buttonDown(0);
            }).pause(500).then(() => {
                //return this.getBrowser().moveToObject(destinationElem);
            }).pause(500).then(() => {
                //return this.getBrowser().buttonUp(0);
            }).pause(1000).then(() => {
                console.log("Items are swapped: " + sourceName + " " + destinationName);
            });
        }
    }
});
module.exports = pageComponentView;
