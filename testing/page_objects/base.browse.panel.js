/**
 * Created on 05/03/2020.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const {TREE_GRID} = require('../libs/elements');
const {Key} = require('webdriverio');

const XPATH = {
    enabledContextMenuButton: name => {
        return `${lib.TREE_GRID_CONTEXT_MENU}/li[contains(@id,'MenuItem') and not(contains(@class,'disabled')) and contains(.,'${name}')]`;
    },
};

class BaseBrowsePanel extends Page {

    get refreshButton() {
        return this.treeGridToolbar + lib.BUTTONS.REFRESH_BUTTON;
    }

    //refresh the grid:
    async clickOnRefreshButton() {
        await this.clickOnElement(this.refreshButton);
        return await this.pause(1000);
    }

    async waitForGridLoaded(ms) {
        try {
            let timeout = typeof ms !== 'undefined' ? ms : appConst.mediumTimeout;
            await this.waitForElementDisplayed(this.browseToolbar, timeout);
            await this.waitForSpinnerNotVisible(timeout);
        } catch (err) {
            await this.handleError('Browse Panel, grid loading. ', 'err_grid', err);
        }
    }

    hotKeyNew() {
        return this.getBrowser().keys(['Alt', 'n']);
    }

    async hotKeyDelete() {
        const isMacOS = await this.isMacOS();
        const keyCombination = isMacOS ? [Key.Command, Key.Delete] : [Key.Ctrl, Key.Delete];
        return await this.getBrowser().keys(keyCombination);
    }

    async hotKeyEdit() {
        const isMacOS = await this.isMacOS();
        const keyCombination = isMacOS ? [Key.Command, 'e'] : [Key.Ctrl, 'e'];
        return await this.getBrowser().keys(keyCombination);
    }

    async clickOnSelectionControllerCheckbox() {
        try {
            await this.clickOnElement(this.selectionControllerCheckBox);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Browse Panel, click on Selection Controller checkbox. ', 'err_click_on_selection_controller', err);
        }
    }

    // wait for the "Show Selection" circle appears in the toolbar
    async waitForSelectionTogglerVisible() {
        try {
            await this.waitForElementDisplayed(this.selectionPanelToggler, appConst.mediumTimeout);
            let attr = await this.getAttribute(this.selectionPanelToggler, 'class');
            return attr.includes('any-selected');
        } catch (err) {
            return false;
        }
    }

    async waitForSelectionTogglerNotVisible() {
        try {
            await this.waitForElementNotDisplayed(this.selectionPanelToggler, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Selection toggle should not be visible. ', 'err_selection_toggler_should_not_visible', err);
        }
    }

    //Clicks on 'circle' (Show Selection tooltip)with a number and filters items in the grid:
    async clickOnSelectionToggler() {
        await this.waitForSelectionTogglerVisible();
        await this.waitForElementDisplayed(this.selectionPanelToggler + "/div[@data-label='selected']", appConst.mediumTimeout);
        await this.clickOnElement(this.selectionPanelToggler)
            .catch(err => this.handleError('Tried to click on Selection Toggle...', 'err_clicking_selection_toggle', err));
        return await this.pause(400);
    }

    //Wait for Selection Controller checkBox gets 'partial', then returns true, otherwise exception will be thrown
    async waitForSelectionControllerPartial() {
        let selector = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(selector, 'class');
            return text.includes('partial');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Selection Controller checkBox should displayed as partial"});
    }

    async isSelectionControllerPartial() {
        let selector = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        let text = await this.getAttribute(selector, 'class');
        return text.includes('partial');
    }

    // returns true if 'Selection Controller' checkbox is selected:
    isSelectionControllerSelected() {
        let selector = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        return this.isSelected(selector);
    }

    // gets list of content display names
    async getDisplayNamesInGrid() {
        try {
            return await this.getTextInElements(this.displayNames);
        } catch (err) {
            await this.handleError('Browse Panel, get display names in grid: ', 'err_get_display_name_grid', err);
        }
    }

    async waitForNewButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.newButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Browse Panel, New button should be disabled. ', 'err_new_button_disabled', err);
        }
    }

    async waitForNewButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.newButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Browse Panel, New button should be enabled. ', 'err_new_button_enabled', err);
        }
    }

    async waitForEditButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.editButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_edit_disabled_button');
            throw Error(`Edit button should be disabled screenshot: ${screenshot} ` + err);
        }
    }

    async waitForEditButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.editButton, appConst.longTimeout);
            return await this.pause(100);
        } catch (err) {
            await this.handleError('Browse Panel, Edit button should be enabled. ', 'err_edit_button_enabled', err);
        }
    }

    isEditButtonEnabled() {
        return this.isElementEnabled(this.editButton);
    }

    async clickOnNewButton() {
        await this.waitForNewButtonEnabled();
        await this.pause(200);
        return await this.clickOnElement(this.newButton);
    }

    async clickOnEditButton() {
        try {
            await this.waitForElementEnabled(this.editButton, appConst.mediumTimeout);
            await this.clickOnElement(this.editButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Browse Panel toolbar, click on Edit button: ', 'err_browse_panel_edit_button', err);
        }
    }

    async clickOnRowByName(name) {
        try {
            let nameXpath = this.treeGrid + TREE_GRID.itemByName(name);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(100);
        } catch (err) {
            await this.handleError('Browse Panel, click on row by name: ', 'err_click_on_row_by_name', err);
        }
    }

    // Click on row-checkbox by name
    async clickOnCheckboxByName(name) {
        let listElements = TREE_GRID.itemByName(name);
        let result = await this.findElements(listElements);
        if (result.length === 0) {
            throw new Error(`Tree grid, The Checkbox was not found! ${name}`);
        }
        let listElement = result[result.length - 1];
        let checkboxElement = await listElement.$('.' + TREE_GRID.TREE_LIST_ITEM_CHECKBOX_LABEL);
        // check only the last element:
        await checkboxElement.waitForDisplayed();
        await checkboxElement.click();
    }

    async clickOnCheckboxByDisplayName(displayName) {
        let checkboxElement = TREE_GRID.itemByDisplayName(displayName) + TREE_GRID.TREE_LIST_ITEM_CHECKBOX_LABEL;
        await this.waitForElementDisplayed(checkboxElement, appConst.mediumTimeout);
        await this.clickOnElement(checkboxElement);
    }

    async waitForRowCheckboxSelected(itemName) {
        let listElements = TREE_GRID.itemByName(itemName);
        let result = await this.findElements(listElements);
        if (result.length === 0) {
            throw new Error(`Tree Grid, Checkbox was not found! ${itemName}`);
        }
        // get the last 'ContentsTreeGridListElement' element:
        let listElement = result[result.length - 1];
        // get the checkbox input for the last 'ContentsTreeGridListElement' element
        let checkboxElement = await listElement.$('.' + TREE_GRID.TREE_LIST_ITEM_CHECKBOX_LABEL);

        await this.getBrowser().waitUntil(async () => {
            let isChecked =  await checkboxElement.getAttribute('aria-checked');
            return isChecked;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "The Checkbox was not selected"});
    }


    async waitForContextMenuDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getDisplayedElements(TREE_GRID.CONTENT_ITEM_CONTEXT_MENU);
            return result.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Tree grid - Context menu was not loaded for the content item"});
    }

    async waitForContextMenuItemNotDisplayed(menuItem) {
        let menuItemSelector = TREE_GRID.itemContextMenuItemByName(menuItem);
        return await this.waitForElementNotDisplayed(menuItemSelector, appConst.mediumTimeout);
    }

    async waitForContextMenuItemEnabled(menuItem) {
        try {
            let menuItemSelector = TREE_GRID.itemContextMenuItemByName(menuItem);
            let el = await this.getDisplayedElements(menuItemSelector);
            if (el.length === 0) {
                throw new Error("Tree Grid, Context Menu item is not displayed: " + menuItem);
            }
            return await this.browser.waitUntil(async () => {
                let result = await el[0].getAttribute('aria-disabled');
                return result===null;
            }, {timeout: appConst.mediumTimeout, timeoutMsg: "context menu item is not enabled in 3000 ms"});
        } catch (err) {
            await this.handleError(`Browse Panel, the context menu item '${menuItem}' should be enabled: `, 'err_context_menu_item_', err);
        }
    }

    async waitForContextMenuItemDisabled(menuItem) {
        let menuItemSelector = TREE_GRID.itemContextMenuItemByName(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        if (el.length === 0) {
            throw new Error("Menu item is not displayed: " + menuItem);
        }
        return await this.browser.waitUntil(async () => {
            let result = await el[0].getAttribute('aria-disabled');
            return result === 'true';
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "context menu item should be disabled"});
    }

    async clickOnMenuItem(menuItem) {
        let menuItemSelector = TREE_GRID.itemContextMenuItemByName(menuItem);
        await this.waitForContextMenuItemEnabled(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        if (el.length === 0) {
            throw new Error(`Tree Grid, Context Menu item was not displayed: ${menuItem}`);
        }
        await el[0].click();
    }

    async doubleClickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = this.treeGrid + TREE_GRID.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.doDoubleClick(nameXpath);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError('Browse Panel, double click on row by displayName: ', 'err_double_click_on_row', err)
        }
    }

    // check for Accessibility attributes: toolbar role
    async waitForBrowseToolbarRoleAttribute(expectedRole) {
        let locator = this.toolbar;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedRole);
    }

    // check for Accessibility attributes: aria-label
    async waitForBrowseToolbarAriaLabelAttribute() {
        let locator = this.toolbar;
        await this.waitForAttributeIsPresent(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ARIA_LABEL);
    }

    // check for Accessibility attributes: ContentAppBar role
    async waitForContentAppBarRoleAttribute(expectedRole) {
        let locator = lib.DIV.CONTENT_APP_BAR_DIV;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedRole);
    }

    // check for Accessibility attributes: ContentAppBar aria-label:
    async waitForContentAppBarAriaLabelAttribute() {
        let locator = lib.DIV.CONTENT_APP_BAR_DIV;
        await this.waitForAttributeIsPresent(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ARIA_LABEL);
    }

    async waitForProjectViewerRoleAttribute(expectedValue) {
        let locator = lib.DIV.CONTENT_APP_BAR_DIV + lib.DIV.PROJECT_VIEWER_DIV;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedValue);
    }

    async waitForProjectViewerAriaHasPopupAttribute(expectedValue) {
        let locator = lib.DIV.CONTENT_APP_BAR_DIV + lib.DIV.PROJECT_VIEWER_DIV;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ARIA_HAS_POPUP, expectedValue);
    }
}

module.exports = BaseBrowsePanel;
