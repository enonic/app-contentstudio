const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ContentDeleteDialog')]`,
    deleteButton: `//button/span[contains(.,'Delete')]`,
    cancelButton: `//button/span[text()='Cancel']`,
    itemList: `//div[contains(@id,'DeleteDialogItemList')]`,
    itemViewer: `//div[contains(@id,'DeleteItemViewer']`,
    deleteItemByDisplayName: function (displayName) {
        return `//div[contains(@id,'DeleteItemViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`
    },
    inboundLink: `//a[contains(@class,'inbound-dependency')]`,
};

// it appears when select a content and click on  'Delete' button on the toolbar
class DeleteContentDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get deleteButton() {
        return XPATH.container + XPATH.deleteButton;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.deleteButton, appConst.TIMEOUT_2);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_close_delete_content_dialog');
            throw new Error('Delete content dialog must be closed');
        })
    }

    clickOnDeleteButton() {
        return this.clickOnElement(this.deleteButton).catch(err => {
            this.saveScreenshot('err_click_on_delete_dialog');
            throw new Error(err);
        })
    }

    clickOnNoButton() {
        return this.clickOnElement(this.noButton);
    }

    isItemHasInboundLink(itemDisplayName) {
        let selector = XPATH.deleteItemByDisplayName(itemDisplayName) + XPATH.inboundLink;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
    }

    getNumberOfInboundDependency(itemDisplayName) {
        let selector = XPATH.deleteItemByDisplayName(itemDisplayName) + XPATH.inboundLink;
        return this.getText(selector);
    }
    async getTotalNumberItemsToDelete() {
        try {
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getText(this.deleteButton);
                return text.includes('(');
            }, appConst.TIMEOUT_3);
            let result = await this.getText(this.duplicateButton);
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error("Error when getting number in Delete button " + err);
        }
    }
};
module.exports = DeleteContentDialog;
