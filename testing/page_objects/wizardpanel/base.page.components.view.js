/**
 * Created on 28.03.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    pageComponentsItemViewer: "//div[contains(@id,'PageComponentsItemViewer')]",
    draggablePageComponentsItemViewer: "//div[contains(@id,'PageComponentsItemViewer') and contains(@class,'draggable')]",
    pageComponentsTreeGrid: `//div[contains(@id,'PageComponentsTreeGrid')]`,
    fragmentsName: "//div[contains(@id,'PageComponentsItemViewer') and descendant::div[contains(@class,'icon-fragment')]]" +
                   lib.H6_DISPLAY_NAME,
    contextMenuItemByName(name) {
        return `//dl[contains(@id,'TreeContextMenu')]//*[contains(@id,'TreeMenuItem') and text()='${name}']`;
    },
    componentByName(name) {
        return `//div[contains(@id,'PageComponentsItemViewer') and descendant::h6[contains(@class,'main-name')  and text()='${name}']]`
    },
    componentDescriptionByName(name) {
        return `//div[contains(@id,'PageComponentsItemViewer') and descendant::h6[contains(@class,'main-name')  and text()='${name}']]` +
               lib.P_SUB_NAME;
    },
    componentByDescription(description) {
        return `//div[contains(@id,'PageComponentsItemViewer') and descendant::p[contains(@class,'sub-name')  and contains(.,'${description}')]]`;
    },
};

class BasePageComponentView extends Page {

    async isComponentSelected(displayName) {
        try {
            let locator = this.container + lib.itemStrictByDisplayName(displayName) +
                          `//ancestor::li[contains(@class,'item-view-wrapper')]`;
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            let cell = await this.findElement(locator);
            let attr = await cell.getAttribute('class');
            return attr.includes('selected');
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pcv_component');
            throw new Error(`Error occurred in 'isComponentSelected' in PCV, screenshot:${screenshot} ` + err);
        }
    }

    async waitForItemSelected(displayName) {
        let locator = this.container + lib.itemStrictByDisplayName(displayName) + `//ancestor::li[contains(@class,'item-view-wrapper')]`;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, 'class');
            return result.includes('selected');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "PCV item should be selected"});

    }

    async waitForItemNotSelected(displayName) {
        let locator = this.container + lib.itemStrictByDisplayName(displayName) + `//ancestor::li[contains(@class,'item-view-wrapper')]`;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, 'class');
            return !result.includes('selected');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "PCV item should not be selected"});

    }

    async waitForComponentItemDisplayed(displayName) {
        let selector = this.container + lib.itemByDisplayName(displayName);
        return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
    }

    async clickOnComponentByDisplayName(displayName) {
        try {
            let selector = this.container + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_click');
            throw new Error(`Page Component View - Error occurred after clicking on the component, screenshot${screenshot}: ` + err);
        }
    }

    async clickOnComponent(componentName) {
        try {
            let component = this.container + xpath.componentByName(componentName);
            await this.waitForElementDisplayed(component, appConst.shortTimeout);
            await this.clickOnElement(component);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_click');
            throw new Error('Error when clicking on the `Component`, screenshot: ' + screenshot + ' ' + err);
        }
    }

    // Click on the toggle icon and expand/collapse the row in PageComponent View
    async clickOnRowExpander(componentName) {
        try {
            let toggleIcon = this.container + xpath.componentByName(componentName) + "/../..//span[contains(@class,'toggle icon')]";
            await this.waitForElementDisplayed(toggleIcon, appConst.shortTimeout);
            await this.pause(300);
            await this.clickOnElement(toggleIcon);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_view');
            throw new Error(`PCV, Error occurred after clicking on 'toggle icon' in the row screenshot:${screenshot} ` + err);
        }
    }

    async getContextMenuItems() {
        let locator = "//dl[contains(@id,'TreeContextMenu')]//*[contains(@id,'TreeMenuItem')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async openMenu(componentName) {
        try {
            let menuButton = this.container + xpath.componentByName(componentName) + "/../..//div[contains(@id,'PageComponentsMenuIcon')]";
            await this.waitForElementDisplayed(menuButton, appConst.shortTimeout);
            await this.pause(300);
            await this.clickOnElement(menuButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_menu');
            throw new Error(`PCV, open menu - Error occurred after clicking on 'Menu button', screenshot:${screenshot} ` + err);
        }
    }

    async openMenuByDescription(description) {
        try {
            let menuButton = this.container + xpath.componentByDescription(description) + "/../..//div[contains(@class,'menu-icon')]";
            await this.waitForElementDisplayed(menuButton, appConst.shortTimeout);
            await this.clickOnElement(menuButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_menu');
            throw new Error(`Page Component View, Error occurred after clicking on 'Menu button', screenshot:${screenshot} ` + err);
        }
    }

    waitForMenuItemNotDisplayed(menuItem) {
        let selector = xpath.contextMenuItemByName(menuItem);
        return this.waitForElementNotDisplayed(selector, appConst.shortTimeout);
    }

    //example: clicks on Insert/Image menu items
    selectMenuItem(items) {
        let result = Promise.resolve();
        items.forEach(menuItem => {
            result = result.then(() => this.clickOnMenuItem(menuItem));
        });
        return result;
    }

    async clickOnMenuItem(menuItem) {
        try {
            let selector = xpath.contextMenuItemByName(menuItem);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_menu');
            throw new Error(`Error - Page Component View: Menu Item, screenshot:${screenshot} ` + err);
        }
    }

    // Wait for Context-menu-item is displayed:
    async waitForMenuItemPresent(name) {
        try {
            let selector = xpath.contextMenuItemByName(name);
            return this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pcv_item');
            throw new Error(`Page Component View - the context menu item is not displayed, screenshot: ${screenshot}  ` + err);
        }
    }

    // Wait for Context-menu-item is disabled:
    async waitForContextMenuItemDisabled(menuItem) {
        try {
            let locator = xpath.contextMenuItemByName(menuItem);
            await this.getBrowser().waitUntil(async () => {
                let atr = await this.getAttribute(locator, 'class');
                return atr.includes('disabled');
            }, {timeout: appConst.mediumTimeout, timeoutMsg: 'The context menu item is not disabled!'});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pcv_context_menu');
            throw new Error(`Page Component View - the context menu item is not disabled, screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForContextMenuItemEnabled(menuItem) {
        try {
            let locator = xpath.contextMenuItemByName(menuItem);
            await this.getBrowser().waitUntil(async () => {
                let atr = await this.getAttribute(locator, 'class');
                return !atr.includes('disabled');
            }, {timeout: appConst.mediumTimeout, timeoutMsg: 'The context menu item is not enabled'});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pcv_context_menu');
            throw new Error(`Page Component View - the context menu item is not enabled, screenshot: ${screenshot}  ` + err);
        }
    }

    async swapComponents(sourceName, destinationName) {
        let sourceElem = this.container + xpath.componentByName(sourceName);
        let destinationElem = this.container + xpath.container + xpath.componentByName(destinationName);
        let source = await this.findElement(sourceElem);
        let destination = await this.findElement(destinationElem);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    async getComponentDescription(name, index) {
        let selector = this.container + xpath.componentDescriptionByName(name);
        if (typeof index === 'undefined' || index === null) {
            return await this.getText(selector);
        } else {
            let result = await this.getTextInElements(selector);
            if (index > result.length) {
                throw new Error(`Component with the index ${index} was not found`)
            }
            return result[index];
        }
    }

    async isItemWithDefaultIcon(partDisplayName, index) {
        let selector = this.container + xpath.componentByName(partDisplayName) +
                       "//div[contains(@id,'NamesAndIconView')]//div[contains(@class,'xp-admin-common-wrapper')]" +
                       "//div[contains(@class,'font-icon-default')]";
        let items = await this.findElements(selector);
        if (!items.length) {
            throw new Error("Component-item with an icon was not found! " + partDisplayName);
        }
        if (typeof index === 'undefined' || index === null) {
            return await items[0].isDisplayed();
        }
        return await items[index].isDisplayed();
    }

    getFragmentsDisplayName() {
        let locator = this.container + xpath.fragmentsName;
        return this.getTextInDisplayedElements(locator);
    }

    async getPageComponentsDisplayName() {
        let locator = this.container + xpath.pageComponentsItemViewer + lib.H6_DISPLAY_NAME;
        return await this.getTextInDisplayedElements(locator);
    }

    async getDraggablePageComponentsDisplayName() {
        let locator = this.container + xpath.draggablePageComponentsItemViewer + lib.H6_DISPLAY_NAME;
        return await this.getTextInDisplayedElements(locator);
    }


    async waitForItemDisplayed(itemDisplayName) {
        try {
            let locator = this.container + xpath.pageComponentsItemViewer + lib.itemByDisplayName(itemDisplayName);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pcv_item');
            throw new Error(`Page Component View -  item is not displayed, screenshot: ${screenshot}  ` + err);
        }
    }

    async expandItem(item) {
        let locator = this.container + lib.itemStrictByDisplayName(item) + `//ancestor::li[contains(@class,'item-view-wrapper')]` +
                      lib.TREE_GRID.EXPANDER_ICON_DIV;
        await this.clickOnElement(locator);
        return await this.pause(200);
    }
}

module.exports = BasePageComponentView;
