const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentDeleteDialog')]`,
    archiveOrDeleteMenu: `//div[contains(@id,'MenuButton')]`,
    archiveButton: `//button/span[contains(.,'Archive')]`,
    deleteNowMenuItem: `//li[contains(@id,'MenuItem') and contains(.,'Delete Now')]`,
    cancelButton: `//button/span[text()='Cancel']`,
    itemToDeleteList: `//ul[contains(@id,'DeleteDialogItemList')]`,
    itemViewer: `//div[contains(@id,'DeleteItemViewer']`,
    inboundWarningPart2: "//h6/span[contains(@class,'part2')]",
    dependantList: "//ul[contains(@id,'DeleteDialogDependantList')]",
    hideDependantItemsLink: "//div[@class='dependants']//h6[@class='dependants-header' and contains(.,'Hide dependent items')]",
    showDependantItemsLink: "//div[@class='dependants']//h6[@class='dependants-header' and contains(.,'Show dependent items')]",
    itemToDeleteByDisplayName: displayName => {
        return `//div[contains(@id,'NamesAndIconView') and descendant::span[contains(@class,'display-name') and contains(.,'${displayName}')]]`
    },
    inboundLink: `//a[contains(@class,'inbound-dependency')]`,
    getContentStatus(displayName) {
        return `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]//div[contains(@class,'status')][2]`
    }
};

// it appears when select a content and click on  'Delete' button on the toolbar
class DeleteContentDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get archiveButton() {
        return XPATH.container + XPATH.archiveOrDeleteMenu + XPATH.archiveButton;
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

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(this.archiveButton, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_archive_dialog'));
            throw new Error('Archive or delete dialog is not loaded ' + err)
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_close_delete_content_dialog');
            throw new Error('Delete content dialog must be closed');
        })
    }

    async clickOnCancelButton() {
        return await this.clickOnElement(this.cancelButton);
    }

    async clickOnCancelTopButton() {
        return await this.clickOnElement(this.cancelTopButton);
    }

    //Clicks on 'Archive' button.(Confirm Archive dialog can appear)
    async clickOnArchiveButton() {
        try {
            await this.waitForElementDisplayed(this.archiveButton, appConst.mediumTimeout);
            await this.clickOnElement(this.archiveButton);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_click_on_delete_now_dialog');
            throw new Error(err);
        }
    }

    async clickOnDeleteNowMenuItem() {
        await this.clickOnArchiveMenuDropDownHandle();
        let menuItem = XPATH.container + XPATH.archiveOrDeleteMenu + XPATH.deleteNowMenuItem;
        await this.waitForElementDisplayed(menuItem, appConst.mediumTimeout);
        await this.clickOnElement(menuItem);
        return await this.pause(300);
    }

    //Call the method for deleting single content, Delete Content should be closed after clicking on the menu item
    async clickOnDeleteNowMenuItemAndWaitForClosed() {
        try {
            await this.clickOnDeleteNowMenuItem();
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.saveScreenshot('err_click_on_delete_now_dialog');
            throw new Error(err);
        }
    }

    //Expands the menu in 'Archive' button
    async clickOnArchiveMenuDropDownHandle() {
        await this.waitForArchiveMenuDropDownHandleDisplayed();
        await this.clickOnElement(this.archiveMenuDropDownHandle);
        return await this.pause(300);
    }

    waitForArchiveMenuDropDownHandleDisplayed() {
        return this.waitForElementDisplayed(this.archiveMenuDropDownHandle, appConst.mediumTimeout);
    }

    getInboundDependenciesWarning() {
        let selector = XPATH.container + XPATH.inboundWarningPart2;
        return this.getText(selector);
    }

    async clickOnShowInboundLink(itemDisplayName) {
        let locator = XPATH.container + XPATH.itemToDeleteByDisplayName(itemDisplayName) +
                      "//div[@title='Click to show the inbound references']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(2000);
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

    async isArchiveMenuDropDownHandleDisplayed() {
        return await this.isElementDisplayed(this.archiveMenuDropDownHandle);
    }

    async getDisplayNamesToArchiveOrDelete() {
        let selector = XPATH.container + XPATH.itemToDeleteList + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(selector);
    }

    async getDependantItemsName() {
        let locator = XPATH.container + XPATH.dependantList + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    waitForHideDependantItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.hideDependantItemsLink, appConst.mediumTimeout);
    }

    waitForShowDependantItemsLinkDisplayed() {
        let locator = XPATH.container + XPATH.showDependantItemsLink;
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async clickOnHideDependantItemsLink() {
        await this.waitForHideDependantItemsLinkDisplayed();
        return await this.clickOnElement(this.hideDependantItemsLink);
    }

    async clickShowDependantItemsLink() {
        await this.waitForShowDependantItemsLinkDisplayed();
        return await this.clickOnElement(this.showDependantItemsLink, appConst.mediumTimeout);
    }

    async getNumberInHideDependantItemsLink() {
        let text = await this.getText(this.hideDependantItemsLink);
        let startIndex = text.indexOf('(');
        let endIndex = text.indexOf(')');
        return text.substring(startIndex + 1, endIndex);
    }

    async waitForNumberInHideDependantItemsLink(number) {
        await this.waitForHideDependantItemsLinkDisplayed();
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getText(this.hideDependantItemsLink);
            return text.includes(number);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Error getting a number in dependant items link: "});
    }

    async getNumberInShowDependantItemsLink() {
        let text = await this.getText(this.showDependantItemsLink);
        let startIndex = text.indexOf('(');
        let endIndex = text.indexOf(')');
        return text.substring(startIndex + 1, endIndex);
    }

    getDependantNames() {
        let locator = XPATH.container + XPATH.dependantList + "//div[contains(@id,'DependantItemViewer')]" + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(locator);
    }
}

module.exports = DeleteContentDialog;
