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
    checkboxByDisplayName: displayName => `${lib.itemByDisplayName(
        displayName)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`,
};

class BaseBrowsePanel extends Page {

    waitForGridLoaded(ms) {
        return this.waitForElementDisplayed(this.treeGrid, ms).then(() => {
            return this.waitForSpinnerNotVisible(ms);
        }).catch(err => {
            throw new Error('Browse panel was not loaded in ' + ms + " " + err);
        });
    }

    hotKeyNew() {
        return this.getBrowser().keys(['Alt', 'n']);
    }

    //returns array that contains display names of items in the grid:
    getDisplayNames() {
        let selector = this.treeGrid + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    hotKeyDelete() {
        return this.getBrowser().status().then(status => {
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                return this.getBrowser().keys(['Control', 'Delete']);
            }
            if (status.os.name.toLowerCase().includes('mac')) {
                return this.getBrowser().keys(['Command', 'Delete']);
            }
        })
    }

    async hotKeyEdit() {
        let status = await this.getBrowser().status();
        if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
            await this.getBrowser().keys(['Control', 'e']);
            return await this.pause(500);
        }
        if (status.os.name.toLowerCase().includes('mac')) {
            await this.getBrowser().keys(['Command', 'e']);
            return await this.pause(500);
        }
    }

    async clickOnSelectionControllerCheckbox() {
        try {
            await this.clickOnElement(this.selectionControllerCheckBox);
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot('err_click_on_selection_controller');
            throw new Error('error when click on selection_controller ' + err);
        }
    }

    //wait for the "Show Selection" circle appears in the toolbar
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
            this.saveScreenshot("err_selection_toggler_should_not_visible");
            throw new Error("Selection toggler should not be visible")
        }
    }

    //Clicks on 'circle' (Show Selection tooltip)with a number and filters items in the grid:
    async clickOnSelectionToggler() {
        try {
            await this.waitForSelectionTogglerVisible();
            await this.clickOnElement(this.selectionPanelToggler);
            return await this.pause(400);
        } catch (err) {
            this.saveScreenshot("err_clicking_on_selection_toggler");
            throw new Error("Selection Toggler: " + err);
        }
    }

    //Wait for Selection Controller checkBox gets 'partial', then returns true, otherwise exception will be thrown
    async waitForSelectionControllerPartial() {
        let selector = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(selector, "class");
            return text.includes('partial');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Selection Controller checkBox should displayed as partial"});
    }

    async isSelectionControllerPartial() {
        let selector = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        let text = await this.getAttribute(selector, "class");
        return text.includes('partial');
    }

    // returns true if 'Selection Controller' checkbox is selected:
    isSelectionControllerSelected() {
        let selector = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        return this.isSelected(selector);
    }

    //gets list of content display names
    getDisplayNamesInGrid() {
        return this.getTextInElements(this.displayNames).catch(err => {
            this.saveScreenshot('err_get_display_name_grid');
            throw new Error(`Error when getting display names in grid` + err);
        });
    }

    waitForNewButtonDisabled() {
        return this.waitForElementDisabled(this.newButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_new_disabled_button');
            throw Error('New... button should be disabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    //Wait for `New` button is visible
    waitForNewButtonVisible() {
        return this.waitForElementDisplayed(this.newButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_new_project_button");
            throw new Error("New button is not visible! " + err);
        })
    }

    waitForNewButtonEnabled() {
        return this.waitForElementEnabled(this.newButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_new_button');
            throw new Error('New button is not enabled in : ' + err);
        })
    }

    isNewButtonEnabled() {
        return this.isElementEnabled(this.newButton);
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_delete_disabled_button');
            throw Error('Browse toolbar - Delete button should be disabled, timeout: ' + 3000 + 'ms')
        })
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_delete_button');
            throw Error('Delete button is not enabled after ' + appConst.mediumTimeout + 'ms')
        })
    }

    isDeleteButtonEnabled() {
        return this.isElementEnabled(this.deleteButton);
    }

    waitForEditButtonDisabled() {
        return this.waitForElementDisabled(this.editButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_edit_disabled_button');
            throw Error('Edit button should be disabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
    }

    waitForEditButtonEnabled() {
        return this.waitForElementEnabled(this.editButton, appConst.longTimeout).catch(err => {
            this.saveScreenshot('err_edit_button');
            throw Error('Edit button is not enabled after ' + appConst.longTimeout + 'ms')
        })
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
            this.saveScreenshot('err_browse_panel_edit_button');
            throw new Error('Browse Panel: Edit button is not enabled! ' + err);
        }
    }

    clickOnRowByName(name) {
        let nameXpath = this.treeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).then(() => {
            return this.clickOnElement(nameXpath);
        }).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' was not found' + err);
        }).then(() => {
            return this.pause(300);
        })
    }

    async waitForContextMenuDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getDisplayedElements(lib.TREE_GRID_CONTEXT_MENU);
            return result.length;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Context menu was not loaded"});
    }

    async waitForContextMenuItemEnabled(menuItem) {
        let menuItemSelector = XPATH.contextMenuItemByName(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        if (!el.length) {
            throw new Error("Menu item is not displayed: " + menuItem);
        }
        return await this.browser.waitUntil(async () => {
            let result = await el[0].getAttribute("class");
            return !result.includes("disabled");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "context menu item is not enabled in 3000 ms"});
    }

    async waitForContextMenuItemDisabled(menuItem) {
        let menuItemSelector = XPATH.contextMenuItemByName(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        if (!el.length) {
            throw new Error("Menu item is not displayed: " + menuItem);
        }
        return await this.browser.waitUntil(async () => {
            let result = await el[0].getAttribute("class");
            return result.includes("disabled");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "context menu item is not disabled in 3000 ms"});
    }

    async clickOnMenuItem(menuItem) {
        let menuItemSelector = XPATH.contextMenuItemByName(menuItem);
        await this.waitForContextMenuItemEnabled(menuItem);
        let el = await this.getDisplayedElements(menuItemSelector);
        return await el[0].click();
    }

    async doubleClickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = this.treeGrid + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.doDoubleClick(nameXpath);
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Browse Panel - Row with the displayName ' + displayName + ' was not found' + err)
        }
    }

    async clickCheckboxAndSelectRowByDisplayName(displayName) {
        try {
            const displayNameXpath = XPATH.checkboxByDisplayName(displayName);
            await this.waitForElementDisplayed(displayNameXpath, appConst.mediumTimeout);
            await this.clickOnElement(displayNameXpath);
            return await this.pause(400);
        } catch (err) {
            this.saveScreenshot('err_find_item');
            throw Error(`Row with the displayName ${displayName} was not found.` + err);
        }
    }

    async clickOnDeleteButton() {
        try {
            await this.waitForElementEnabled(this.deleteButton, appConst.shortTimeout);
            return await this.clickOnElement(this.deleteButton);
        } catch (err) {
            this.saveScreenshot('err_browsepanel_delete_button');
            throw new Error('Delete button is not enabled! ' + err);
        }
    }

    async waitForRowCheckboxSelected(itemName) {
        let checkboxDiv = this.treeGrid + `${lib.itemByName(
            itemName)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]`;

        await this.getBrowser().waitUntil(async () => {
            let classAttr = await this.getAttribute(checkboxDiv, 'class');
            return classAttr.includes("selected");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "row and Checkbox is not selected"});
    }
}

module.exports = BaseBrowsePanel;
