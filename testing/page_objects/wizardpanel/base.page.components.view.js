/**
 * Created on 28.03.2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const {COMMON} = require('../../libs/elements');

const xpath = {
    parentListElement: "//ancestor::div[contains(@class,'item-view-wrapper')]",
    pageComponentsItemName: "//div[@data-component='ContextMenu.Trigger']//span[text()]",
    fragmentsName: "//div[@data-component='ContextMenu.Trigger'][.//*[contains(@class,'lucide-puzzle')]]//span[contains(@class,'truncate')]",
    pageComponentsItemViewer: "//div[contains(@id,'PageComponentsItemViewer')]",
    contextMenuItems:"//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item']",
    pageComponentsItemViewerByType(componentType) {
        return `//div[contains(@id,'PageComponentsItemViewer') and contains(@class,'${componentType}')]`
    },
    pageComponentsTreeGrid: `//div[contains(@id,'PageComponentsTreeGrid')]`,
    contextMenuTrigger(name) {
        return `//div[@data-component='ContextMenu.Trigger']//span[@class and contains(@class, 'truncate') and text()='${name}']`
    },
    contextMenuItemByName(name) {
        return `//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item' and text()='${name}']`
    },
    // Matches Item or SubTrigger in the top-level menu (text only, no SVG children at this level)
    contextMenuTopLevelItemByName(name) {
        return `//div[@data-component='ContextMenu.Content']//*[(@data-component='ContextMenu.Item' or @data-component='ContextMenu.SubTrigger') and normalize-space(text())='${name}']`
    },
    // Matches Item inside a SubContent panel (icon + text node)
    contextSubMenuItemByName(name) {
        return `//div[@data-component='ContextMenu.SubContent']//div[@data-component='ContextMenu.Item' and normalize-space(.)='${name}']`
    },
    // Expand/collapse button inside the ContextMenu.Trigger row for the given component name
    rowExpanderButton(name) {
        return `//div[@data-component='ContextMenu.Trigger' and .//span[contains(@class,'truncate') and text()='${name}']]//button`
    },
};

class BasePageComponentView extends Page {

    async rightClickAndOpenContextMenu(name) {
        try {
            let contextMenuTrigger = this.container + xpath.contextMenuTrigger(name);
            await this.waitForElementDisplayed(contextMenuTrigger);
            await this.pause(300);
            // Perform right click
            let element = await this.findElement(contextMenuTrigger);
            await element.click({button: 2});
            // Wait for context menu to appear
            let locator = COMMON.PCV.contextMenuDiv;
            await this.waitForElementDisplayed(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Error when right-clicking on context menu trigger: ${name} in PCV`, 'err_right_click_menu', err);
        }
    }

    async clickOnMenuItem(menuItem) {
        try {
            let selector = xpath.contextMenuItemByName(menuItem);
            await this.waitForElementDisplayed(selector);
            await this.clickOnElement(selector);
            return await this.pause(700);
        } catch (err) {
            await this.handleError(`Error when clicking on the menu item: ${menuItem} in PCV`, 'err_click_menu_item', err);
        }
    }

    async isComponentSelected(displayName) {
        try {
            let locator = this.container +
                          `//div[@data-component='ContextMenu.Trigger']//span[contains(@class,'truncate') and text()='${displayName}']` +
                          `/ancestor::div[@role='button']`;
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            let attr = await this.getAttribute(locator, 'class');
            return attr.includes('bg-surface-selected');
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pcv_component');
            throw new Error(`Error occurred in 'isComponentSelected' in PCV, screenshot:${screenshot} ` + err);
        }
    }

    async waitForItemSelected(displayName) {
        let locator = this.container +
                      `//div[@data-component='ContextMenu.Trigger']//span[contains(@class,'truncate') and text()='${displayName}']` +
                      `/ancestor::div[@role='button']`;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, 'class');
            return result.includes('bg-surface-selected');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: `PCV item '${displayName}' should be selected`});
    }

    async waitForItemNotSelected(displayName) {
        let locator = this.container +
                      `//div[@data-component='ContextMenu.Trigger']//span[contains(@class,'truncate') and text()='${displayName}']` +
                      `/ancestor::div[@role='button']`;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, 'class');
            return !result.includes('bg-surface-selected');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: `PCV item '${displayName}' should not be selected`});
    }

    async waitForComponentItemDisplayed(displayName) {
        let selector = this.container +
                       `//div[@data-component='ContextMenu.Trigger']//span[contains(@class,'truncate') and text()='${displayName}']`;
        return await this.waitForElementDisplayed(selector);
    }

    async clickOnComponentByDisplayName(displayName) {
        try {
            let selector = this.container +
                           `//div[@data-component='ContextMenu.Trigger']//span[contains(@class,'truncate') and text()='${displayName}']`;
            await this.waitForElementDisplayed(selector);
            await this.clickOnElement(selector);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_click');
            throw new Error(`Page Component View - Error occurred after clicking on the component, screenshot${screenshot}: ` + err);
        }
    }

    async clickOnComponent(componentName) {
        try {
            let item = this.container + xpath.contextMenuTrigger(componentName);
            await this.waitForElementDisplayed(item);
            await this.clickOnElement(item);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_click');
            throw new Error('Error when clicking on the `Component`, screenshot: ' + screenshot + ' ' + err);
        }
    }

    // Click on the toggle icon and expand/collapse the row in PageComponent View
    async clickOnRowExpander(componentName) {
        try {
            let toggleButton = this.container + xpath.rowExpanderButton(componentName);
            await this.waitForElementDisplayed(toggleButton);
            await this.pause(300);
            await this.clickOnElement(toggleButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_component_view');
            throw new Error(`PCV, Error clicking row expander for '${componentName}', screenshot:${screenshot} ` + err);
        }
    }


    async getContextMenuItems() {
        let locator = xpath.contextMenuItems;
        await this.waitForElementDisplayed(locator);
        return await this.getTextInDisplayedElements(locator);
    }

    waitForMenuItemNotDisplayed(menuItem) {
        let selector = xpath.contextMenuItemByName(menuItem);
        return this.waitForElementNotDisplayed(selector, appConst.shortTimeout);
    }

    async selectMenuItem(items) {
        try {
            for (const menuItem of items) {
                await this.clickOnMenuItem(menuItem);
            }
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_menu_items');
            throw new Error(`Error selecting menu items: ${items.join(' → ')}, screenshot:${screenshot} ` + err);
        }
    }

    // Supports two-level context menus: items[0] is clicked in the top-level menu (Item or SubTrigger),
    // items[1..n] are clicked in the SubContent panel that opens after hovering the SubTrigger.
    async selectContextMenuItem(items) {
        try {
            const [firstItem, ...subItems] = items;
            let firstSelector = xpath.contextMenuTopLevelItemByName(firstItem);
            await this.waitForElementDisplayed(firstSelector, appConst.mediumTimeout);
            await this.clickOnElement(firstSelector);
            await this.pause(500);
            for (const item of subItems) {
                let selector = xpath.contextSubMenuItemByName(item);
                await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
                await this.clickOnElement(selector);
                await this.pause(500);
            }
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_context_menu');
            throw new Error(`Error selecting context menu items: ${items.join(' → ')}, screenshot:${screenshot} ` + err);
        }
    }

    // Wait for Context-menu-item is displayed:
    async waitForMenuItemPresent(name) {
        try {
            let selector = xpath.contextMenuTopLevelItemByName(name);
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
        let destinationElem = this.container + xpath.componentByName(destinationName);
        let source = await this.findElement(sourceElem);
        let destination = await this.findElement(destinationElem);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
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

    async getFragmentsDisplayName() {
        let locator = this.container + xpath.fragmentsName;
        return await this.getTextInDisplayedElements(locator);
    }

    async getPageComponentsDisplayName() {
        let locator = this.container + xpath.pageComponentsItemName;
        return await this.getTextInDisplayedElements(locator);
    }

    async getTextComponentsDisplayName() {
        let locator = this.container +
                      `//div[@data-component='ContextMenu.Trigger'][.//*[contains(@class,'lucide-pen-line')]]` +
                      `//span[contains(@class,'truncate')]`;
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForItemDisplayed(itemDisplayName) {
        try {
            let locator = this.container +
                          `//div[@data-component='ContextMenu.Trigger']//span[contains(@class,'truncate') and text()='${itemDisplayName}']`;
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError(`Page Component View - item '${itemDisplayName}' should be displayed`, 'err_pcv_item_displayed', err);
        }
    }

    async isComponentInvalid(name) {
        try {
            let locator = this.container +
                          `//div[@data-component='ContextMenu.Trigger' and descendant::span[contains(@class,'truncate') and text()='${name}']]` +
                          `//*[contains(@class,'lucide-octagon-alert')]`;
            return await this.isElementDisplayed(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pcv_component_invalid');
            throw new Error(`Error checking invalid state for component '${name}' in PCV, screenshot:${screenshot} ` + err);
        }
    }

    async isComponentItemInvalid(itemDisplayName) {
        try {
            let locator = this.container + xpath.componentByName(itemDisplayName) + "//div[contains(@class,'xp-admin-common-wrapper')]";  //div[contains(@class,'xp-admin-common-wrapper')]
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            let attr = await this.getAttribute(locator, 'class');
            return attr.includes('icon-state-invalid');
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_layout');
            throw new Error(`Error during checking the component  in PCV, screenshot:${screenshot} ` + err);
        }
    }

    async expandItem(item) {
        let locator = this.container + xpath.rowExpanderButton(item);
        await this.waitForElementDisplayed(locator);
        await this.clickOnElement(locator);
        return await this.pause(200);
    }
}

module.exports = BasePageComponentView;
