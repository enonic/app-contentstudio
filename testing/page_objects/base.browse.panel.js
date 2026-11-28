/**
 * Created on 05/03/2020.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const { TREE_GRID } = require('../libs/elements');
const { Key } = require('webdriverio');

class BaseBrowsePanel extends Page {
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
        return this.getBrowser().keys([Key.Alt, 'n']);
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

    async clickOnSelectAllCheckbox() {
        try {
            await this.clickOnElement(this.selectAllCheckboxLabel);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                'Browse Panel, tried to click on Select all checkbox. ',
                'err_click_on_select_all',
                err,
            );
        }
    }

    async waitforSelectAllCheckboxDisplayed() {
        try {
            await this.waitForElementDisplayed(this.selectAllCheckboxLabel);
        } catch (err) {
            await this.handleError(
                `Browse Panel, 'Select all' checkbox should be displayed. `,
                'err_select_all_checkbox',
                err,
            );
        }
    }

    // Input of the selection controller checkbox in the tree list toolbar. Its label is 'Select all' when nothing
    // is selected and 'Clear selection (N)' when rows are selected. The input is visually hidden ('sr-only'),
    // its state is exposed in 'data-state': 'unchecked', 'checked' (all rows are selected) or 'indeterminate'.
    get selectionControllerCheckBox() {
        return "//input[@type='checkbox' and (@aria-label='Select all' or contains(@aria-label,'Clear selection'))]";
    }

    async getSelectionControllerState() {
        await this.waitForExist(this.selectionControllerCheckBox, appConst.mediumTimeout);
        return await this.getAttribute(this.selectionControllerCheckBox, 'data-state');
    }

    // Waits until the selection controller checkbox gets 'partial' - the 'minus' icon with the 'Clear selection (N)' label
    // (some rows are selected, but not all):
    async waitForSelectionControllerPartial() {
        try {
            await this.getBrowser().waitUntil(
                async () => {
                    let state = await this.getSelectionControllerState();
                    return state === 'indeterminate';
                },
                {
                    timeout: appConst.mediumTimeout,
                    timeoutMsg: 'Selection Controller checkbox should be displayed as partial',
                },
            );
        } catch (err) {
            await this.handleError(
                'Browse Panel, Selection Controller checkbox should be partial. ',
                'err_selection_controller_partial',
                err,
            );
        }
    }

    // returns true if the selection controller checkbox is 'partial' (some rows are selected, but not all):
    async isSelectionControllerPartial() {
        let state = await this.getSelectionControllerState();
        return state === 'indeterminate';
    }

    // returns true if the selection controller checkbox is checked (all loaded rows are selected):
    async isSelectionControllerSelected() {
        let state = await this.getSelectionControllerState();
        return state === 'checked';
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
            return await this.waitForElementDisabled(this.newButton);
        } catch (err) {
            await this.handleError('Browse Panel, New button should be disabled. ', 'err_new_button_disabled', err);
        }
    }

    async waitForNewButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.newButton);
        } catch (err) {
            await this.handleError('Browse Panel, New button should be enabled. ', 'err_new_button_enabled', err);
        }
    }

    async waitForEditButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.editButton);
        } catch (err) {
            await this.handleError('Browse Panel, Edit button should be disabled. ', 'err_edit_disabled_button', err);
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

    async clickOnNewButton() {
        await this.waitForNewButtonEnabled();
        await this.pause(200);
        return await this.clickOnElement(this.newButton);
    }

    async clickOnEditButton() {
        try {
            await this.waitForElementEnabled(this.editButton);
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
        try {
            let rowLocator = TREE_GRID.itemByName(name);
            await this.waitForElementDisplayed(rowLocator, appConst.mediumTimeout);
            let rows = await this.findElements(rowLocator);
            // click on the checkbox in the last row with this name:
            let checkboxElement = await rows[rows.length - 1].$('.' + TREE_GRID.TREE_LIST_ITEM_CHECKBOX_LABEL);
            await checkboxElement.waitForDisplayed({ timeout: appConst.mediumTimeout });
            await checkboxElement.click();
        } catch (err) {
            await this.handleError(
                `Browse Panel, tried to click on the checkbox in the row: ${name}`,
                'err_click_on_row_checkbox',
                err,
            );
        }
    }

    async clickOnCheckboxByDisplayName(displayName) {
        let checkboxElement = TREE_GRID.itemByDisplayName(displayName) + TREE_GRID.TREE_LIST_ITEM_CHECKBOX_LABEL;
        await this.waitForElementDisplayed(checkboxElement, appConst.mediumTimeout);
        await this.clickOnElement(checkboxElement);
    }

    // Waits until the checkbox in the row gets checked (aria-checked='true'):
    async waitForRowCheckboxSelected(itemName) {
        try {
            let rowLocator = TREE_GRID.itemByName(itemName);
            await this.getBrowser().waitUntil(
                async () => {
                    let rows = await this.findElements(rowLocator);
                    if (rows.length === 0) {
                        return false;
                    }
                    // check only the last row with this name:
                    let checkboxElement = await rows[rows.length - 1].$('.' + TREE_GRID.TREE_LIST_ITEM_CHECKBOX_LABEL);
                    let ariaChecked = await checkboxElement.getAttribute('aria-checked');
                    return ariaChecked === 'true';
                },
                { timeout: appConst.mediumTimeout, timeoutMsg: 'The checkbox was not selected in the row' },
            );
        } catch (err) {
            await this.handleError(
                `Browse Panel, checkbox should be selected in the row: ${itemName}`,
                'err_row_checkbox_selected',
                err,
            );
        }
    }

    async waitForContextMenuDisplayed() {
        try {
            await this.getBrowser().waitUntil(
                async () => {
                    let result = await this.getDisplayedElements(TREE_GRID.CONTENT_ITEM_CONTEXT_MENU);
                    return result.length > 0;
                },
                {
                    timeout: appConst.mediumTimeout,
                    timeoutMsg: 'Tree grid - Context menu was not loaded for the content item',
                },
            );
        } catch (err) {
            await this.handleError('Browse Panel, context menu should be displayed. ', 'err_context_menu', err);
        }
    }

    async waitForContextMenuItemNotDisplayed(menuItem) {
        try {
            let menuItemSelector = TREE_GRID.itemContextMenuItemByName(menuItem);
            return await this.waitForElementNotDisplayed(menuItemSelector, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Browse Panel, the context menu item '${menuItem}' should not be displayed: `,
                'err_context_menu_item_displayed',
                err,
            );
        }
    }

    // Waits until the context menu item is displayed and gets the expected state.
    // A disabled item has aria-disabled='true', an enabled one has no such attribute.
    // Errors are not handled here - callers wrap this method with handleError.
    async waitForContextMenuItemState(menuItem, shouldBeDisabled) {
        let menuItemSelector = TREE_GRID.itemContextMenuItemByName(menuItem);
        let expectedState = shouldBeDisabled ? 'disabled' : 'enabled';
        await this.getBrowser().waitUntil(
            async () => {
                let elements = await this.getDisplayedElements(menuItemSelector);
                if (elements.length === 0) {
                    return false;
                }
                let ariaDisabled = await elements[0].getAttribute('aria-disabled');
                return (ariaDisabled === 'true') === shouldBeDisabled;
            },
            {
                timeout: appConst.mediumTimeout,
                timeoutMsg: `Context menu item '${menuItem}' is not displayed or not ${expectedState} in ${appConst.mediumTimeout} ms`,
            },
        );
    }

    async waitForContextMenuItemEnabled(menuItem) {
        try {
            await this.waitForContextMenuItemState(menuItem, false);
        } catch (err) {
            await this.handleError(
                `Browse Panel, the context menu item '${menuItem}' should be enabled: `,
                'err_context_menu_item_enabled',
                err,
            );
        }
    }

    async waitForContextMenuItemDisabled(menuItem) {
        try {
            await this.waitForContextMenuItemState(menuItem, true);
        } catch (err) {
            await this.handleError(
                `Browse Panel, the context menu item '${menuItem}' should be disabled: `,
                'err_context_menu_item_disabled',
                err,
            );
        }
    }

    // Waits until the context menu item gets enabled then clicks on it:
    async clickOnMenuItem(menuItem) {
        try {
            await this.waitForContextMenuItemState(menuItem, false);
            let elements = await this.getDisplayedElements(TREE_GRID.itemContextMenuItemByName(menuItem));
            await elements[0].click();
        } catch (err) {
            await this.handleError(
                `Browse Panel, tried to click on the context menu item '${menuItem}': `,
                'err_click_context_menu_item',
                err,
            );
        }
    }

    async doubleClickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = this.treeGrid + TREE_GRID.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.doDoubleClick(nameXpath);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                'Browse Panel, double click on row by displayName: ',
                'err_double_click_on_row',
                err,
            );
        }
    }

    // check for Accessibility attributes: toolbar role
    async waitForBrowseToolbarRoleAttribute(expectedRole) {
        let locator = this.toolbar;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedRole);
    }
}

module.exports = BaseBrowsePanel;
