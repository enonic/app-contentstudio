/**
 * Created on 10.04.2020
 */
const Page = require('../page');
const ConfirmationDialog = require('../confirmation.dialog');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const PrincipalFilterPanel = require('./principal.filter.panel');

const xpath = {
    container: "//div[contains(@id,'UserBrowsePanel')]",
    selectionToggler: "//button[contains(@id,'SelectionPanelToggler')]",
    toolbar: "//div[contains(@id,'UserBrowseToolbar')]",
    grid: "//div[contains(@class,'grid-canvas')]",
    searchButton: "//button[contains(@class, 'icon-search')]",
    hideFilterPanelButton: "//span[contains(@class, 'hide-filter-panel-button')]",
    appHomeButton: "//div[contains(@id,'TabbedAppBar')]/div[contains(@class,'home-button')]",
    rowByName: function (name) {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'${name}')]]`
    },
    rowByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    checkboxByName: function (name) {
        return `${lib.itemByName(name)}` +
               `/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },

    checkboxByDisplayName: function (displayName) {
        return `${lib.itemByDisplayName(displayName)}` +
               `/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },

    expanderIconByName: function (name) {
        return this.rowByName(name) +
               `/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`;

    },
    closeItemTabButton: function (name) {
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

    waitForPanelVisible(ms) {
        return this.waitForElementDisplayed(xpath.toolbar, ms).catch(err => {
            throw new Error('User browse panel was not loaded in ' + ms);
        });
    }

    clickOnNewButton() {
        return this.waitForElementEnabled(this.newButton, appConst.mediumTimeout).catch(err => {
            throw new Error("New button is not enabled!" + err);
        }).then(() => {
            return this.clickOnElement(this.newButton);
        });
    }

    clickOnEditButton() {
        return this.waitForElementEnabled(this.editButton, appConst.mediumTimeout).catch(err => {
            throw new Error("Edit button is not enabled!" + err);
        }).then(() => {
            return this.clickOnElement(this.editButton);
        });
    }

    waitForUsersGridLoaded(ms) {
        return this.waitForElementDisplayed(xpath.grid, ms).then(() => {
            return this.waitForSpinnerNotVisible();
        }).then(() => {
            return console.log('user browse panel is loaded')
        }).catch(err => {
            this.saveScreenshot("err_load_grid");
            throw new Error('users browse panel was not loaded in: ' + ms + " " + err);
        });
    }

    isItemDisplayed(itemName) {
        return this.waitForElementDisplayed(xpath.rowByName(itemName), appConst.shortTimeout).catch(err => {
            console.log("item is not displayed:" + itemName + +" " + err);
            return false;
        });
    }

    clickOnRowByName(name) {
        let nameXpath = xpath.rowByName(name);
        return this.clickOnElement(nameXpath, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' was not found.  ' + err);
        }).then(() => {
            return this.pause(500);
        });
    }

    waitForFolderUsersVisible() {
        return this.waitForElementDisplayed(xpath.rowByName('users'), appConst.mediumTimeout).catch(err => {
            console.log("element is not visible: row with Users");
            throw new Error(`Users folder was not found! ` + err);
        });
    }

    clickOnSearchButton() {
        return this.clickOnElement(this.searchButton);
    }

    clickOnDeleteButton() {
        return this.clickOnElement(this.deleteButton).catch(err => {
            this.saveScreenshot('err_browsepanel_delete');
            throw new Error('Error when clicking on Delete button ! ' + err);
        })
    }

    isSearchButtonDisplayed() {
        return this.isElementDisplayed(this.searchButton);
    }

    waitForNewButtonEnabled() {
        return this.waitForElementEnabled(this.newButton, appConst.mediumTimeout);
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            throw new Error('Delete button is not enabled ! ' + err);
        });
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
    }

    isEditButtonEnabled() {
        return this.waitForElementEnabled(this.editButton, appConst.shortTimeout);
    }

    waitForEditButtonDisabled() {
        return this.waitForElementDisabled(this.editButton, appConst.mediumTimeout);
    }

    waitForRowByNameVisible(name) {
        let nameXpath = xpath.rowByName(name);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' is not visible in ' + 3000 + 'ms')
        })
    }

    waitForRowByDisplayNameVisible(displayName) {
        let nameXpath = xpath.rowByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).catch(err => {
            throw Error('Row with the name ' + displayName + ' is not visible in ' + appConst.mediumTimeout + 'ms')
        })
    }

    clickCheckboxAndSelectRowByDisplayName(displayName) {
        let displayNameXpath = xpath.checkboxByDisplayName(displayName);
        return this.waitForElementDisplayed(displayNameXpath, appConst.shortTimeout).then(() => {
            return this.clickOnElement(displayNameXpath);
        }).catch(err => {
            this.saveScreenshot('err_find_item');
            throw Error('Row with the displayName ' + displayName + ' was not found')
        })
    }

    doClickOnCloseTabButton(displayName) {
        let closeIcon = `${xpath.closeItemTabButton(displayName)}`;
        return this.waitForElementDisplayed(closeIcon, appConst.TIMEOUT_4).then(() => {
            return this.clickOnElement(closeIcon);
        }).catch(err => {
            throw new Error('itemTabButton was not found! ' + displayName + '  ' + err);
        })
    }

    hotKeyNew() {
        return this.browser.status().then(status => {
            return this.browser.keys(['Control', 'Alt', 'n']);
        })
    }

    hotKeyEdit() {
        return this.browser.keys(['F4']);
    }

    hotKeyDelete() {
        return this.browser.status().then(status => {
            return this.browser.keys(['Control', 'Delete']);
        })
    }

    //Click on existing Tab-Item and navigates to the opened wizard:
    async clickOnTabBarItem(displayName) {
        let tabItem = xpath.itemTabByDisplayName(displayName);
        await this.waitForElementDisplayed(tabItem);
        return await this.clickOnElement(tabItem);
    }

    async doClickOnCloseTabAndWaitGrid(displayName) {
        try {
            let closeIcon = xpath.closeItemTabButton(displayName);
            await this.waitForElementDisplayed(closeIcon, appConst.shortTimeout);
            await this.waitForElementEnabled(closeIcon, appConst.shortTimeout);
            await this.clickOnElement(closeIcon);
        } catch (err) {
            throw new Error('Item Tab Button was not found!' + displayName + "  " + err);
        }
        await this.pause(300);
        let confirmationDialog = new ConfirmationDialog();
        let isLoaded = await confirmationDialog.isDialogVisible();
        if (isLoaded) {
            this.saveScreenshot('err_save_close_item');
            console.log('confirmation dialog must not be loaded');
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
        }, appConst.mediumTimeout, 'expected style not present after 3s');
    }

    rightClickOnRowByDisplayName(displayName) {
        const selector = xpath.rowByDisplayName(displayName);
        return this.waitForElementDisplayed(selector, appConst.mediumTimeout).then(() => {
            return this.doRightClick(selector);
        }).catch(err => {
            this.saveScreenshot(`err_find_${displayName}`);
            throw Error(`Row with the name ${displayName} was not found  ` + err);
        })
    }

    async findAndSelectItem(name) {
        await this.typeNameInFilterPanel(name);
        await this.waitForRowByNameVisible(name);
        await this.clickOnRowByName(name);
        return await this.pause(500);
    }

    //Opens Filter Panel and types a text in the search input
    async typeNameInFilterPanel(name) {
        let filterPanel = new PrincipalFilterPanel();
        await this.clickOnSearchButton();
        await filterPanel.waitForOpened();
        await filterPanel.typeSearchText(name);
        await this.pause(300);
        await this.waitForSpinnerNotVisible();
    }

    async selectAndDeleteItem(name) {
        let confirmationDialog = new ConfirmationDialog();
        await this.findAndSelectItem(name);
        await this.waitForDeleteButtonEnabled();
        await this.clickOnDeleteButton();
        await confirmationDialog.waitForDialogOpened();
        await confirmationDialog.clickOnYesButton();
        await confirmationDialog.waitForDialogClosed();
        return await this.waitForSpinnerNotVisible();
    }
}

module.exports = UserBrowsePanel;
