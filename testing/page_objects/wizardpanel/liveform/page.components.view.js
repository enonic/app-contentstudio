/**
 * Created on 28.03.2018.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
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
    componentDescriptionByName: function (name) {
        return `//div[contains(@id,'PageComponentsItemViewer') and descendant::h6[contains(@class,'main-name')  and text()='${name}']]` +
               lib.P_SUB_NAME;
    },
};
//Modal Dialog:
class PageComponentView extends Page {

    clickOnComponent(displayName) {
        let selector = xpath.container + lib.itemByDisplayName(displayName);
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3).then(() => {
            return this.clickOnElement(selector);
        }).catch(err => {
            throw new Error("Page Component View - Error when clicking on the component " + err);
        }).then(() => {
            return this.pause(400);
        });
    }

    async openMenu(componentName) {
        try {
            let menuButton = xpath.componentByName(componentName) + "/../..//div[contains(@class,'menu-icon')]";
            await this.waitForElementDisplayed(menuButton, appConst.TIMEOUT_2);
            await this.clickOnElement(menuButton);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_component_view');
            throw new Error('Page Component View, open menu - Error when clicking on `Menu button`: ' + err);
        }
    }

    async clickOnComponent(componentName) {
        try {
            let component = xpath.componentByName(componentName);
            await this.waitForElementDisplayed(component, appConst.TIMEOUT_2);
            await this.clickOnElement(component);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_component_view');
            throw new Error('Error when clicking on the `Component`: ' + err);
        }
    }

    async isComponentSelected(displayName) {
        let rowXpath = lib.slickRowByDisplayName(xpath.container,displayName)+ "//div[contains(@class,'slick-cell')]";
        await this.waitForElementDisplayed(rowXpath,appConst.TIMEOUT_2);
        let cell = await this.findElement(rowXpath);
        let attr=  await cell.getAttribute("class");
        return attr.includes("selected");
    }

    isMenuItemPresent(name) {
        let selector = xpath.contextMenuItemByName(name);
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2).catch(err => {
            console.log(err);
            return false;
        })
    }

    //example: clicks on Insert/Image menu items
    selectMenuItem(items) {
        let result = Promise.resolve();
        items.forEach(menuItem => {
            result = result.then(() => this.clickOnMenuItem(menuItem));
        });
        return result;
    }

    clickOnMenuItem(menuItem) {
        let selector = xpath.contextMenuItemByName(menuItem);
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_menu_item");
            throw new Error("Page Component View: Menu Item still not visible - " + menuItem + " " + err);
        }).then(() => {
            return this.clickOnElement(selector);
        }).then(() => {
            return this.pause(300);
        });
    }

    waitForOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.TIMEOUT_2);
    }

    async swapComponents(sourceName, destinationName) {
        let sourceElem = xpath.container + xpath.componentByName(sourceName);
        let destinationElem = xpath.container + xpath.componentByName(destinationName);
        let source = await this.findElement(sourceElem);
        let destination = await this.findElement(destinationElem);
        await source.dragAndDrop(destination);
        await this.pause(1000);
    }

    async getComponentDescription(name) {
        let selector = xpath.container + xpath.componentDescriptionByName(name);
        //let elems = await this.findElements(selector);
        //await this.waitForElementDisplayed(selector,appConst.TIMEOUT_4);
        return await this.getText(selector);
    }
};
module.exports = PageComponentView;
