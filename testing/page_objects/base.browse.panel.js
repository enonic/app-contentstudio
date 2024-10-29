/**
 * Created on 05/03/2020.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');

const XPATH = {
    enabledContextMenuButton: name => {
        return `${lib.TREE_GRID_CONTEXT_MENU}/li[contains(@id,'MenuItem') and not(contains(@class,'disabled')) and contains(.,'${name}')]`;
    },
    contextMenuItemByName: (name) => {
        return `${lib.TREE_GRID_CONTEXT_MENU}/li[contains(@id,'MenuItem') and contains(.,'${name}')]`;
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
            let screenshot = await this.saveScreenshotUniqueName('err_switch');
            throw new Error(`Error occurred in grid,  screenshot: ${screenshot} ` + err);
        }
    }

    hotKeyNew() {
        return this.getBrowser().keys(['Alt', 'n']);
    }

    hotKeyDelete() {
        return this.getBrowser().keys(['Control', 'Delete']);
    }

    async hotKeyEdit() {
        let status = await this.getBrowser().status();
        await this.getBrowser().keys(['Control', 'e']);
        return await this.pause(500);
    }

    async clickOnSelectionControllerCheckbox() {
        try {
            await this.clickOnElement(this.selectionControllerCheckBox);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_selection_controller');
            throw new Error('error when click on selection_controller, screenshot: ' + screenshot + ' ' + err);
        }
    }

    // wait for the "Show Selection" circle appears in the toolbar
    async waitForSelectionTogglerVisible() {
        try {
            await this.waitForElementDisplayed(this.selectionPanelToggler, appConst.mediumTimeout);
            let attr = await this.getAttribute(this.selectionPanelToggler, 'class');
            return attr.includes('any-selected');
        } catch (err) {
            return false
        }
    }

    async waitForSelectionTogglerNotVisible() {
        try {
            await this.waitForElementNotDisplayed(this.selectionPanelToggler, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName("err_selection_toggler_should_not_visible");
            throw new Error(`Selection toggler should not be visible, screenshot: ${screenshot} ` + err);
        }
    }

    //Clicks on 'circle' (Show Selection tooltip)with a number and filters items in the grid:
    async clickOnSelectionToggler() {
        try {
            await this.waitForSelectionTogglerVisible();
            await this.clickOnElement(this.selectionPanelToggler);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName("err_clicking_on_selection_toggler");
            throw new Error("Selection Toggler, screenshot: " + screenshot + '' + err);
        }
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
            return await this.getTextInElements(this.displayNames)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_get_display_name_grid');
            throw new Error(`Error occurred when getting display names in grid, screenshot:${screenshot} ` + err);
        }
    }

    async waitForNewButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.newButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_new_disabled_button');
            throw Error(`New... button should be disabled, screenshot:${screenshot} ` + err);
        }
    }

    //Wait for `New` button is visible
    waitForNewButtonVisible() {
        return this.waitForElementDisplayed(this.newButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_new_project_button');
            throw new Error("New button is not visible! " + err);
        })
    }

    async waitForNewButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.newButton, appConst.mediumTimeout);
            await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_new_button');
            throw new Error(`New button is not enabled , screenshot:${screenshot} ` + err);
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
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_edit_button');
            throw Error(`Edit button is not enabled, screenshot: ${screenshot} ` + err);
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
            return await this.pause(1500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_browse_panel_edit_button');
            throw new Error(`Browse Panel: Edit button is not enabled! screenshot:${screenshot}  ` + err);
        }
    }

    async clickOnRowByName(name) {
        try {
            let nameXpath = this.treeGrid + lib.itemByName(name);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_content');
            throw Error('Row with the content was not found, screenshot: ' + screenshot + ' ' + err);
        }
    }

    // Click on row-checkbox by name
    async clickOnCheckboxByName(name) {
        let listElements = lib.TREE_GRID.itemTreeGridListElementByName(name);
        let result = await this.findElements(listElements);
        if (result.length === 0) {
            throw new Error('Checkbox was not found!');
        }
        let listElement = result[result.length - 1];
        let checkboxElement = await listElement.$('.' + lib.DIV.CHECKBOX_DIV + '/label');
        // check only the last element:
        await checkboxElement.waitForDisplayed();
        await checkboxElement.click();
        return await this.pause(200);
    }

    async waitForRowCheckboxSelected(itemName) {
        let listElements = lib.TREE_GRID.itemTreeGridListElementByName(itemName);
        let result = await this.findElements(listElements);
        if (result === 0) {
            throw new Error('Checkbox was not found!');
        }
        // get the last 'ContentsTreeGridListElement' element:
        let listElement = result[result.length - 1];
        // get the checkbox input for the last 'ContentsTreeGridListElement' element
        let checkboxElement = await listElement.$('.' + lib.INPUTS.CHECKBOX_INPUT);

        await this.getBrowser().waitUntil(async () => {
            let isSelected = await checkboxElement.isSelected();
            return isSelected;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Checkbox is not selected"});
    }

    async clickOnCheckboxByDisplayName(displayName) {
        let checkboxElement = lib.TREE_GRID.itemTreeGridListElementByDisplayName(displayName) + lib.DIV.CHECKBOX_DIV + '/label';
        await this.waitForElementDisplayed(checkboxElement, appConst.mediumTimeout);
        await this.clickOnElement(checkboxElement);
        return await this.pause(200);
    }


    async waitForContextMenuDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getDisplayedElements(lib.TREE_GRID_CONTEXT_MENU);
            return result.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Context menu was not loaded"});
    }

    async waitForContextMenuItemNotDisplayed(menuItem) {
        let menuItemSelector = XPATH.contextMenuItemByName(menuItem);
        return await this.waitForElementNotDisplayed(menuItemSelector, appConst.mediumTimeout);
    }

    async waitForContextMenuItemEnabled(menuItem) {
        let menuItemSelector = XPATH.contextMenuItemByName(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        if (el.length === 0) {
            throw new Error("Menu item is not displayed: " + menuItem);
        }
        return await this.browser.waitUntil(async () => {
            let result = await el[0].getAttribute('class');
            return !result.includes('disabled');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "context menu item is not enabled in 3000 ms"});
    }

    async waitForContextMenuItemDisabled(menuItem) {
        let menuItemSelector = XPATH.contextMenuItemByName(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        if (el.length === 0) {
            throw new Error("Menu item is not displayed: " + menuItem);
        }
        return await this.browser.waitUntil(async () => {
            let result = await el[0].getAttribute('class');
            return result.includes('disabled');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "context menu item is not disabled in 3000 ms"});
    }

    async clickOnMenuItem(menuItem) {
        let menuItemSelector = XPATH.contextMenuItemByName(menuItem);
        await this.waitForContextMenuItemEnabled(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        if (el.length === 0) {
            throw new Error("Menu item is not displayed: " + menuItem);
        }
        await el[0].click();
        return await this.pause(1000);
    }

    async doubleClickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = this.treeGrid + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.doDoubleClick(nameXpath);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_');
            throw Error('Browse Panel - Row with the displayName was not found, screenshot: ' + screenshot + ' ' + err)
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
