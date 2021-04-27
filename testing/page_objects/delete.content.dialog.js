const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentDeleteDialog')]`,
    deleteMenu: `//div[contains(@id,'MenuButton')]`,
    deleteNowButton: `//button/span[contains(.,'Delete Now')]`,
    markAsDeletedMenuItem: `//li[contains(@id,'MenuItem') and text()='Mark As Deleted']`,
    cancelButton: `//button/span[text()='Cancel']`,
    itemToDeleteList: `//ul[contains(@id,'DeleteDialogItemList')]`,
    itemViewer: `//div[contains(@id,'DeleteItemViewer']`,
    deleteItemByDisplayName: function (displayName) {
        return `//div[contains(@id,'DeleteItemViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
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

    get deleteNowButton() {
        return XPATH.container + XPATH.deleteMenu + XPATH.deleteNowButton;
    }

    get deleteMenuDropDownHandle() {
        return XPATH.container + XPATH.deleteMenu + lib.DROP_DOWN_HANDLE;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.deleteNowButton, appConst.shortTimeout);
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

    async clickOnDeleteNowButton() {
        try {
            await this.clickOnElement(this.deleteNowButton);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_click_on_delete_now_dialog');
            throw new Error(err);
        }
    }

    async clickOnDeleteNowButtonAndClose() {
        try {
            await this.clickOnElement(this.deleteNowButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            this.saveScreenshot('err_click_on_delete_now_dialog');
            throw new Error(err);
        }
    }

    clickOnNoButton() {
        return this.clickOnElement(this.noButton);
    }

    async clickOnDeleteMenuDropDownHandle() {
        await this.clickOnElement(this.deleteMenuDropDownHandle);
        return await this.pause(300);
    }

    async clickOnMarkAsDeletedMenuItem() {
        await this.clickOnDeleteMenuDropDownHandle();
        let selector = XPATH.container + XPATH.deleteMenu + XPATH.markAsDeletedMenuItem;
        await this.clickOnElement(selector);
        return await this.pause(300);
    }

    isItemHasInboundLink(itemDisplayName) {
        let selector = XPATH.deleteItemByDisplayName(itemDisplayName) + XPATH.inboundLink;
        return this.waitForElementDisplayed(selector, appConst.shortTimeout);
    }

    getNumberOfInboundDependency(itemDisplayName) {
        let selector = XPATH.deleteItemByDisplayName(itemDisplayName) + XPATH.inboundLink;
        return this.getText(selector);
    }

    async getTotalNumberItemsToDelete() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getText(this.deleteNowButton);
                return text.includes('(');
            }, {timeout: appConst.mediumTimeout});
            let result = await this.getText(this.deleteNowButton);
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error("Error when getting number in Delete button " + err);
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

    async isDeleteNowButtonDisplayed() {
        return this.isElementDisplayed(this.deleteNowButton);
    }

    async isDeleteMenuDropDownHandleDisplayed() {
        return await this.isElementDisplayed(this.deleteMenuDropDownHandle);
    }

    waitForDeleteMenuDropDownHandleDisabled() {
        return this.waitForElementDisabled(this.deleteMenuDropDownHandle, appConst.mediumTimeout);
    }

    async getDisplayNamesToDelete() {
        let selector = XPATH.container + XPATH.itemToDeleteList + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(selector);
    }
}

module.exports = DeleteContentDialog;
