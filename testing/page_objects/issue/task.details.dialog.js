const BaseDetailsDialog = require('./base.details.dialog');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    editIssueTitleToggle: `//h2[@class='inplace-text' and @title='Click to  edit']`,
    closeIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Close Issue']]`,
    closeRequestButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Close Request')]]`,
    reopenIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Issue']]`,
    reopenRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Request']]`,
    commentButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment']]`,
    itemsTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Items')]]",
    assigneesTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Assignees')]]",
    commentsTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Comments')]]",
    issueStatusSelector: `//div[contains(@id,'IssueStatusSelector')]`,
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    issueCommentsListItem: `//div[contains(@id,'IssueCommentsListItem')]`,
    noActionLabel: `//div[@class='no-action-message']`,
    issueCommentsListItemByText:
        text => `//div[contains(@id,'IssueCommentsListItem') and descendant::p[@class='inplace-text' and text()='${text}']]`,
    issueStatusMenuItem:
        menuItem => `//ul[contains(@class,'menu')]/li[contains(@id,'TabMenuItem') and child::a[text()='${menuItem}']]`,

};

class TaskDetailsDialog extends BaseDetailsDialog {

    get closeIssueButton() {
        return XPATH.container + XPATH.closeIssueButton;
    }

    get reopenIssueButton() {
        return XPATH.container + XPATH.reopenIssueButton;
    }

    get itemsTabBarItem() {
        return XPATH.container + XPATH.itemsTabBarItem;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_load_issue_details_dialog');
            throw new Error('Issue Details dialog is not loaded ' + err)
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('err_close_is_det_dialog');
            throw new Error('Issue Details Dialog must be closed! ' + err)
        })
    }

    async getNumberOfItems() {
        let xpath = this.itemsTabBarItem + '/a';
        let result = await this.getText(xpath);
        let startIndex = result.indexOf('(');
        if (startIndex == -1) {
            return undefined;
        }
        let endIndex = result.indexOf(')');
        return result.substring(startIndex + 1, endIndex);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForReopenButtonLoaded() {
        return this.waitForElementDisplayed(XPATH.reopenIssueButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Issue Details dialog `Reopen button` is not loaded ' + err)
        });
    }

    waitForCloseButtonLoaded() {
        return this.waitForElementDisplayed(XPATH.closeIssueButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Issue Details dialog `Close button` is not loaded ' + err)
        });
    }

    async clickOnCloseIssueButton() {
        try {
            await this.waitForElementDisplayed(this.closeIssueButton, appConst.TIMEOUT_3);
            await this.clickOnElement(this.closeIssueButton);
            //reopen Issue button should appear!
            return await this.waitForElementDisplayed(this.reopenIssueButton, appConst.TIMEOUT_3);
        } catch (err) {
            this.saveScreenshot('err_click_close_issue_button');
            throw  new Error('Error when clicking on the `Close Issue`  ' + err);
        }
    }

    async clickOnReopenIssueButton() {
        await this.clickOnElement(this.reopenIssueButton);
        await this.pause(800);
    }

    isCloseIssueButtonDisplayed() {
        return this.isElementDisplayed(this.closeIssueButton);
    }

    async getIssueTitle() {
        let result = await this.getText(XPATH.issueNameInPlaceInput + '/h2');
        let endIndex = result.indexOf('#');
        return result.substring(0, endIndex).trim();
    }

    async getNumberInItemsTab() {
        let result = await this.getText(this.itemsTabBarItem);
        let startIndex = result.indexOf('(');
        if (startIndex == -1) {
            return undefined;
        }
        let endIndex = result.indexOf(')');
        return result.substring(startIndex + 1, endIndex);
    }

    isItemsTabBarItemActive() {
        return this.getAttribute(this.itemsTabBarItem, 'class').then(result => {
            return result.includes('active');
        }).catch(err => {
            throw  new Error('Issue Details Dialog  ' + err);
        })
    }

    clickOnItemsTabBarItem() {
        return this.waitForElementDisplayed(this.itemsTabBarItem, appConst.TIMEOUT_2).then(() => {
            return this.clickOnElement(this.itemsTabBarItem);
        }).catch(err => {
            this.saveScreenshot('err_click_on_items_tabbar_item');
            throw new Error('Issue Details Dialog:error when click on Items tab bar item: ' + err)
        }).then(() => {
            return this.pause(500);
        });
    }
};
module.exports = TaskDetailsDialog;
