const BaseDetailsDialog = require('./base.details.dialog');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    editIssueTitleToggle: `//h2[@class='inplace-text' and @title='Click to  edit']`,
    reopenIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Issue']]`,
    itemsTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Items')]]",
    issueStatusSelectorDiv: `//div[contains(@id,'IssueStatusSelector')]`,
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    issueCommentsListItem: `//div[contains(@id,'IssueCommentsListItem')]`,
    noActionLabel: `//div[@class='no-action-message']`,
    closeTabMenuItem: "//li[contains(@id,'TabMenuItem') and child::a[text()='Closed']]",
};

class IssueDetailsDialog extends BaseDetailsDialog {

    get reopenIssueButton() {
        return XPATH.container + XPATH.reopenIssueButton;
    }

    get issueStatusSelector() {
        return XPATH.container + XPATH.issueStatusSelectorDiv;
    }

    get itemsTabBarItem() {
        return XPATH.container + XPATH.itemsTabBarItem;
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot('err_load_issue_details_dialog');
            throw new Error('Issue Details dialog is not loaded ' + err)
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_close_issue_det_dialog');
            throw new Error('Issue Details Dialog must be closed! ' + err)
        })
    }

    async getNumberOfItems() {
        let xpath = this.itemsTabBarItem + '/a';
        let result = await this.getText(xpath);
        let startIndex = result.indexOf('(');
        if (startIndex === -1) {
            return undefined;
        }
        let endIndex = result.indexOf(')');
        return result.substring(startIndex + 1, endIndex);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    async waitForReopenButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(XPATH.reopenIssueButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_reopen_issue_btn');
            throw new Error(`Issue Details dialog 'Reopen issue' was not loaded! screenshot:  ${screenshot}  ` + err);
        }
    }

    async clickOnReopenIssueButton() {
        await this.clickOnElement(this.reopenIssueButton);
        await this.pause(800);
    }

    async getIssueTitle() {
        let result = await this.getText(XPATH.issueNameInPlaceInput + '/h2');
        let endIndex = result.indexOf('#');
        return result.substring(0, endIndex).trim();
    }

    async getNumberInItemsTab() {
        let result = await this.getText(this.itemsTabBarItem);
        let startIndex = result.indexOf('(');
        if (startIndex === -1) {
            return undefined;
        }
        let endIndex = result.indexOf(')');
        return result.substring(startIndex + 1, endIndex);
    }

    async isItemsTabBarItemActive() {
        try {
            let result = await this.getAttribute(this.itemsTabBarItem, 'class');
            return result.includes('active');
        } catch (err) {
            throw new Error('Issue Details Dialog  ' + err);
        }
    }

    async clickOnItemsTabBarItem() {
        try {
            await this.waitForElementDisplayed(this.itemsTabBarItem, appConst.mediumTimeout);
            await this.clickOnElement(this.itemsTabBarItem);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_click_on_items_tab_bar_item');
            throw new Error('Issue Details Dialog: error during clicking on Items tab bar item: ' + err)
        }
    }

    async clickOncloseTabMenuItem() {
        await this.waitForElementDisplayed(XPATH.closeTabMenuItem, appConst.mediumTimeout);
        await this.pause(200);
        await this.clickOnElement(XPATH.closeTabMenuItem);
    }

    // gets text in title attribute:
    async getIssueStatusInfo() {
        await this.waitForElementDisplayed(this.issueStatusSelector, appConst.mediumTimeout);
        let titleAttr = await this.getAttribute(this.issueStatusSelector, 'title');
        return titleAttr;
    }
}

module.exports = IssueDetailsDialog;
