/**
 * Created on 10.04.2020
 */
const Page = require('../page');
const ConfirmationDialog = require('../confirmation.dialog');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'UserBrowsePanel')]",
    selectionToggler: "//button[contains(@id,'SelectionPanelToggler')]",
    selectionControllerCheckBox: "//div[contains(@id,'SelectionController')]",
    toolbar: "//div[contains(@id,'UserBrowseToolbar')]",
    grid: "//div[contains(@class,'grid-canvas')]",
    treeGridToolbar: `//div[contains(@id,'TreeGridToolbar')]`,
    searchButton: "//button[contains(@class, 'icon-search')]",
    hideFilterPanelButton: "//span[contains(@class, 'hide-filter-panel-button')]",
    appHomeButton: "//div[contains(@id,'TabbedAppBar')]/div[contains(@class,'home-button')]",
    rowByName(name) {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    rowByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    checkboxByName(name) {
        return `${lib.itemByName(name)}` +
               `/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },
    checkboxByDisplayName(displayName) {
        return `${lib.itemByDisplayName(displayName)}` +
               `/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },
    expanderIconByName(name) {
        return this.rowByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;
    },
    closeItemTabButton(name) {
        return `//div[contains(@id,'AppBar')]//li[contains(@id,'AppBarTabMenuItem') and child::a[@class='label' and text() ='${name}']]/button`;
    },
    itemTabByDisplayName:
        displayName => `//div[contains(@id,'AppBar')]//li[contains(@id,'AppBarTabMenuItem') and child::a[@class='label' and text() ='${displayName}']]`,
};

class UserBrowsePanel extends Page {
    get newButton() {
        return xpath.toolbar + "/*[contains(@id, 'ActionButton') and child::span[contains(.,'New')]]";
    }

    get selectionToggler() {
        return xpath.container + xpath.selectionToggler;
    }

    get appHomeButton() {
        return xpath.appHomeButton;
    }

    get searchButton() {
        return xpath.toolbar + xpath.searchButton;
    }

    get hideFilterPanelButton() {
        return "//div[contains(@id,'PrincipalBrowseFilterPanel')]" + xpath.hideFilterPanelButton;
    }

    get editButton() {
        return `${xpath.toolbar}/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
    }

    get deleteButton() {
        return `${xpath.toolbar}/*[contains(@id, 'ActionButton') and child::span[text()='Delete']]`;
    }

    get selectionControllerCheckBox() {
        return xpath.treeGridToolbar + xpath.selectionControllerCheckBox;
    }

    waitForPanelVisible(ms) {
        return this.waitForElementDisplayed(xpath.toolbar, ms).catch(err => {
            throw new Error('User browse panel was not loaded ' + err);
        });
    }

    async clickOnNewButton() {
        try {
            await this.waitForElementEnabled(this.newButton, appConst.mediumTimeout)
            return await this.clickOnElement(this.newButton);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_new_btn'));
            throw new Error("Error during clicking on New button!" + err);
        }
    }

    async waitForUsersGridLoaded(ms) {
        try {
            await this.waitForElementDisplayed(xpath.grid, ms);
            await this.waitForSpinnerNotVisible();
            console.log('user browse panel is loaded');
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_grid');
            throw new Error('Users browse panel was not loaded screenshot: ' + screenshot + ' ' + err);
        }
    }

    isItemDisplayed(itemName) {
        return this.waitForElementDisplayed(xpath.rowByName(itemName), appConst.mediumTimeout).catch(err => {
            console.log("item is not displayed:" + itemName + +" " + err);
            return false;
        });
    }

    async waitForItemNotDisplayed(itemName) {
        try {
            await this.waitForElementNotDisplayed(xpath.rowByName(itemName), appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_item');
            throw new Error('The item should not be displayed, screenshot:' + screenshot + '  ' + err);
        }
    }

    async waitForItemByDisplayNameNotDisplayed(itemDisplayName) {
        try {
            await this.waitForElementNotDisplayed(xpath.rowByDisplayName(itemDisplayName), appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_item');
            throw new Error("The item should not be displayed, screenshot:" + screenshot + "  " + err);
        }
    }

    async waitForItemByDisplayNameDisplayed(itemDisplayName) {
        try {
            await this.waitForElementDisplayed(xpath.rowByDisplayName(itemDisplayName), appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_item');
            throw new Error('The item should be displayed, screenshot:' + screenshot + "  " + err);
        }
    }

    async clickOnRowByName(name) {
        try {
            let nameXpath = xpath.rowByName(name);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_item');
            throw new Error('Item was not found. screenshot: ' + screenshot + ' ' + err);
        }
    }

    async waitForFolderUsersVisible() {
        try {
            return this.waitForElementDisplayed(xpath.rowByName('users'), appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_users_folder');
            throw new Error(`Users folder was not found! screenshot: ` + screenshot + ' ' + err);
        }
    }

    clickOnSearchButton() {
        return this.clickOnElement(this.searchButton);
    }

    async clickOnHideFilterButton() {
        try {
            await this.clickOnElement(this.hideFilterPanelButton)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_filter_button');
            throw new Error('Error,screenshot: ' + screenshot + '  ' + err);
        }
    }

    async clickOnAppHomeButton() {
        await this.waitForElementEnabled(this.appHomeButton, appConst.mediumTimeout);
        await this.clickOnElement(this.appHomeButton);
        return await this.pause(1000);
    }

    async clickOnEditButton() {
        await this.waitForEditButtonEnabled();
        return await this.clickOnElement(this.editButton);
    }

    async clickOnDeleteButton() {
        await this.waitForDeleteButtonEnabled();
        return await this.clickOnElement(this.deleteButton);
    }

    isSearchButtonDisplayed() {
        return this.isElementDisplayed(this.searchButton);
    }

    waitForNewButtonEnabled() {
        return this.waitForElementEnabled(this.newButton, appConst.mediumTimeout);
    }

    waitForEditButtonEnabled() {
        return this.waitForElementEnabled(this.editButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_edit_button_not_enabled');
            throw new Error('Edit button is not enabled ! ' + err);
        });
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_delete_button_not_enabled');
            throw new Error('Delete button is not enabled ! ' + err);
        });
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
    }

    isEditButtonEnabled() {
        return this.waitForElementEnabled(this.editButton, appConst.mediumTimeout);
    }

    waitForEditButtonDisabled() {
        return this.waitForElementDisabled(this.editButton, appConst.mediumTimeout);
    }

    async waitForRowByNameVisible(name) {
        try {
            let nameXpath = xpath.rowByName(name);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_item');
            throw Error('Row was not found: screenshot' + screenshot + '  ' + err);
        }
    }
    waitForRowByDisplayNameVisible(displayName) {
        let nameXpath = xpath.rowByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).catch(err => {
            throw Error('Row with the name ' + displayName + ' is not visible in ' + appConst.mediumTimeout + 'ms')
        })
    }

    async clickOnCheckboxAndSelectRowByDisplayName(displayName) {
        try {
            let displayNameXpath = xpath.checkboxByDisplayName(displayName);
            await this.waitForElementDisplayed(displayNameXpath, appConst.mediumTimeout);
            await this.clickOnElement(displayNameXpath);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_item');
            throw Error('Row checkbox, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async doClickOnCloseTabButton(displayName) {
        try {
            let closeIcon = `${xpath.closeItemTabButton(displayName)}`;
            await this.waitForElementDisplayed(closeIcon, appConst.TIMEOUT_4);
            await this.clickOnElement(closeIcon);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_close');
            throw new Error('itemTabButton was not found! screenshot: ' + screenshot + ' ' + err);
        }
    }

    hotKeyNew() {
        return this.browser.status().then(status => {
            console.log('browser status:' + status);
            return this.browser.keys(['Alt', 'n']);
        })
    }

    hotKeyEdit() {
        return this.browser.keys(['Control', 'e']);
    }

    hotKeyDelete() {
        return this.browser.status().then(status => {
            return this.browser.keys(['Control', 'Delete']);
        })
    }

    //Click on existing Tab-Item and navigates to the opened wizard:
    async clickOnTabBarItem(displayName) {
        let tabItem = xpath.itemTabByDisplayName(displayName);
        await this.waitForElementDisplayed(tabItem, appConst.mediumTimeout);
        return await this.clickOnElement(tabItem);
    }

    async closeTabAndWaitForGrid(displayName) {
        let closeIcon = xpath.closeItemTabButton(displayName);
        await this.waitForElementDisplayed(closeIcon, appConst.mediumTimeout);
        await this.waitForElementEnabled(closeIcon, appConst.mediumTimeout);
        await this.clickOnElement(closeIcon);
        await this.pause(500);
        let confirmationDialog = new ConfirmationDialog();
        let isLoaded = await confirmationDialog.isDialogVisible();
        if (isLoaded) {
            await this.saveScreenshot('err_save_close_item');
            throw new Error('Confirmation dialog should not appear when try to close the ' + displayName);
        }
        await this.waitForSpinnerNotVisible();
        return await this.waitForUsersGridLoaded(appConst.mediumTimeout);
    }

    clickOnExpanderIcon(name) {
        let expanderIcon = xpath.expanderIconByName(name);
        return this.clickOnElement(expanderIcon);
    }

    getGridItemDisplayNames() {
        let selector = xpath.container + lib.SLICK_ROW + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    waitForSelectionTogglerVisible() {
        let selector = xpath.container + xpath.selectionToggler;
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return result.includes('any-selected');
            })
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'expected style not present after 3s'});
    }

    // Click on Show/Hide selections
    async clickOnSelectionToggler() {
        let selector = xpath.container + xpath.selectionToggler;
        await this.clickOnElement(selector);
        return await this.pause(1000);
    }

    isSelectionTogglerVisible() {
        let selector = xpath.container + xpath.selectionToggler;
        return this.getAttribute(selector, 'class').then(result => {
            return result.includes('any-selected');
        });
    }

    getNumberInSelectionToggler() {
        let selector = xpath.selectionToggler + '/span';
        return this.getText(selector);
    }

    async rightClickOnRowByDisplayName(displayName) {
        try {
            const selector = xpath.rowByDisplayName(displayName);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.doRightClick(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_right_click');
            throw Error(`Error during right click on the row, screenshot:  ` + screenshot + '  ' + err);
        }
    }

    // Wait for Selection Controller checkBox gets 'partial', then returns true, otherwise exception will be thrown
    async waitForSelectionControllerPartial() {
        let selector = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(selector, 'class');
            return text.includes('partial');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Selection Controller checkBox should displayed as partial'});
        return true;
    }

    // returns true if 'Selection Controller' checkbox is selected:
    isSelectionControllerSelected() {
        let locator = this.selectionControllerCheckBox + "//input[@type='checkbox']";
        return this.isSelected(locator);
    }

    async clickOnSelectionControllerCheckbox() {
        try {
            await this.clickOnElement(this.selectionControllerCheckBox);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot('err_click_on_selection_controller');
            throw new Error('error when click on selection_controller ' + err);
        }
    }

    async isRowHighlighted(name) {
        let locator = `${lib.itemByDisplayName(name)}` +
                      `/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let attribute = await this.getAttribute(locator, 'class');
        return attribute.includes('highlight');
    }
}

module.exports = UserBrowsePanel;
