const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentDeleteDialog')]`,
    inboundErrorStateEntry: "//div[contains(@id,'DialogStateEntry')]/span[text()='Inbound references']",
    archiveOrDeleteMenu: `//div[contains(@id,'MenuButton')]`,
    deleteMenuItem: `//li[contains(@id,'MenuItem') and contains(.,'Delete')]`,
    cancelButton: `//button/span[text()='Cancel']`,
    itemToDeleteList: `//ul[contains(@id,'DialogWithRefsItemList')]`,
    itemViewer: `//div[contains(@id,'DeleteItemViewer']`,
    dependantListUl: "//ul[contains(@id,'DialogWithRefsDependantList')]",
    dependantsHeader: "//div[@class='dependants-header']/span[@class='dependants-title']",
    itemToDeleteByDisplayName: displayName => {
        return `//div[contains(@id,'NamesAndIconView') and descendant::span[contains(@class,'display-name') and contains(.,'${displayName}')]]`
    },
    inboundLink: `//a[contains(@class,'inbound-dependency')]`,
    getContentStatus(displayName) {
        return `//div[contains(@id,'ArchiveSelectableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`;
    },
    showReferencesButton(displayName) {
        return `//div[contains(@id,'ArchiveSelectableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/button[contains(@id,'ActionButton') and child::span[text()='Show references']]`;
    }
};

// it appears when select a content and click on  'Delete' button on the toolbar
class DeleteContentDialog extends Page {

    get dependentsHeader() {
        return XPATH.container + XPATH.dependantsHeader;
    }

    get cancelButton() {
        return XPATH.container + lib.dialogButton('Cancel');
    }

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get archiveButton() {
        return XPATH.container + XPATH.archiveOrDeleteMenu + lib.actionButton('Archive');
    }

    get archiveMenuDropDownHandle() {
        return XPATH.container + XPATH.archiveOrDeleteMenu + lib.DROP_DOWN_HANDLE;
    }

    get hideDependantItemsLink() {
        return XPATH.container + XPATH.hideDependantItemsLink;
    }

    get showDependantItemsLink() {
        return XPATH.container + XPATH.showDependantItemsLink;
    }

    get ignoreInboundReferencesButton() {
        return XPATH.container + lib.actionButton('Ignore inbound references');
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(this.archiveButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_archive_dialog_opened', err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_close_delete_content_dialog');
            throw new Error('Delete content dialog must be closed ' + err);
        })
    }

    async clickOnCancelButton() {
        return await this.clickOnElement(this.cancelButton);
    }

    async clickOnCancelTopButton() {
        return await this.clickOnElement(this.cancelTopButton);
    }

    // Clicks on 'Archive' button.(Confirm Archive dialog can appear)
    async clickOnArchiveButton() {
        try {
            await this.waitForElementDisplayed(this.archiveButton, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.archiveButton, appConst.mediumTimeout);
            await this.clickOnElement(this.archiveButton);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_click_on_archive_button', err);
        }
    }

    async clickOnDeleteMenuItem() {
        await this.clickOnArchiveMenuDropDownHandle();
        let menuItem = XPATH.container + XPATH.archiveOrDeleteMenu + XPATH.deleteMenuItem;
        await this.waitForElementDisplayed(menuItem, appConst.mediumTimeout);
        await this.clickOnElement(menuItem);
    }

    // Call the method for deleting single content, Delete Content should be closed after clicking on the menu item
    async clickOnDeleteMenuItemAndWaitForClosed() {
        try {
            await this.clickOnDeleteMenuItem();
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_click_on_delete_menu_item', err);
        }
    }

    //Expands the menu in 'Archive' button
    async clickOnArchiveMenuDropDownHandle() {
        await this.waitForArchiveMenuDropDownHandleDisplayed();
        await this.waitForArchiveMenuDropDownHandleEnabled();
        await this.clickOnElement(this.archiveMenuDropDownHandle);
    }

    waitForArchiveMenuDropDownHandleDisplayed() {
        return this.waitForElementDisplayed(this.archiveMenuDropDownHandle, appConst.mediumTimeout);
    }

    waitForArchiveMenuDropDownHandleEnabled() {
        return this.waitForElementEnabled(this.archiveMenuDropDownHandle, appConst.mediumTimeout);
    }

    waitForArchiveMenuDropDownHandleDisabled() {
        return this.waitForElementDisabled(this.archiveMenuDropDownHandle, appConst.mediumTimeout);
    }

    async clickOnShowReferencesButton(itemDisplayName) {
        let buttonLocator = XPATH.showReferencesButton(itemDisplayName);
        await this.waitForSpinnerNotVisible();
        await this.waitForInboundReferencesEntryDisplayed();
        await this.waitForElementDisplayed(buttonLocator, appConst.mediumTimeout);
        await this.clickOnElement(buttonLocator);
        return await this.pause(3000);
    }

    async getNumberInArchiveButton() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getText(this.archiveButton);
                return text.includes('(');
            }, {timeout: appConst.mediumTimeout});
            let result = await this.getText(this.archiveButton);
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error("Error when getting number in Archive button " + err);
        }
    }

    async getContentStatus(displayName) {
        let selector = XPATH.container + XPATH.getContentStatus(displayName);
        return await this.getText(selector);
    }

    async isCancelButtonDisplayed() {
        return this.isElementDisplayed(this.cancelButton);
    }

    async isCancelTopButtonDisplayed() {
        return this.isElementDisplayed(this.cancelTopButton);
    }

    async isArchiveButtonDisplayed() {
        return this.isElementDisplayed(this.archiveButton);
    }

    async waitForArchiveButtonDisabled() {
        return this.waitForElementDisabled(this.archiveButton, appConst.mediumTimeout);
    }

    async waitForArchiveButtonEnabled() {
        return this.waitForElementEnabled(this.archiveButton, appConst.mediumTimeout);
    }

    async isArchiveMenuDropDownHandleDisplayed() {
        return await this.isElementDisplayed(this.archiveMenuDropDownHandle);
    }

    async getDisplayNamesToArchiveOrDelete() {
        let selector = XPATH.container + XPATH.itemToDeleteList + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(selector);
    }

    async getDependantItemsName() {
        let locator = XPATH.container + XPATH.dependantListUl + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }


    async waitForDependantsHeaderDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependentsHeader, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_dependants_header_displayed', err);
        }
    }

    async waitForShowReferencesButtonDisplayed(displayName) {
        let locator = XPATH.showReferencesButton(displayName);
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async clickOnIgnoreInboundReferences() {
        try {
            await this.waitForIgnoreInboundReferencesButtonDisplayed();
            await this.clickOnElement(this.ignoreInboundReferencesButton);
            return await this.pause(700);
        } catch (err) {
            await this.handleError('Delete Content Dialog', 'err_ignore_inbound_ref', err);
        }
    }

    waitForIgnoreInboundReferencesButtonDisplayed() {
        return this.waitForElementDisplayed(this.ignoreInboundReferencesButton, appConst.mediumTimeout);
    }

    waitForIgnoreInboundReferencesButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.ignoreInboundReferencesButton, appConst.mediumTimeout);
    }

    async waitForInboundReferencesEntryDisplayed() {
        return await this.waitForElementDisplayed(XPATH.inboundErrorStateEntry, appConst.mediumTimeout)
    }
}

module.exports = DeleteContentDialog;
