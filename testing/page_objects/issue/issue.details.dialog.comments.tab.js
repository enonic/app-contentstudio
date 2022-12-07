const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    commentAndCloseRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment & Close Request']]`,
    commentAndCloseIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment & Close Issue']]`,
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    noCommentsMessage: "//h5[@class='empty-list-item']",
    commentsList: "//ul[contains(@id,'IssueCommentsList')]",
    issueCommentsListItemByText:
        text => `//div[contains(@id,'IssueCommentsListItem') and descendant::p[@class='inplace-text' and text()='${text}']]`,
};

class IssueDetailsDialogCommentsTab extends Page {

    get issueCommentTextArea() {
        return XPATH.container + XPATH.issueCommentTextArea + lib.TEXT_AREA;
    }

    get commentButton() {
        return XPATH.container + lib.dialogButton('Comment');
    }

    get commentAndCloseRequestButton() {
        return XPATH.container + XPATH.commentAndCloseRequestButton;
    }

    get commentAndCloseIssueButton() {
        return XPATH.container + XPATH.commentAndCloseIssueButton;
    }

    isCommentTextAreaDisplayed() {
        return this.isElementDisplayed(this.issueCommentTextArea);
    }

    isCommentButtonDisplayed() {
        return this.isElementDisplayed(this.commentButton);
    }

    waitForCommentButtonEnabled() {
        return this.waitForElementEnabled(this.commentButton).catch(err => {
            throw  new Error('Issue Details Dialog,Comments tab  ' + err);
        })
    }

    async clickOnCommentButton() {
        await this.clickOnElement(this.commentButton);
        return await this.pause(500);
    }

    typeComment(text) {
        return this.typeTextInInput(this.issueCommentTextArea, text);
    }

    isCommentPresent(text) {
        let selector = XPATH.issueCommentsListItemByText(text);
        return this.isElementDisplayed(selector);
    }

    isCommentButtonEnabled() {
        return this.isElementEnabled(this.commentButton);
    }

    updateComment(comment, text) {
        let commentTextArea = XPATH.issueCommentsListItemByText(comment) + `//textarea`;
        return this.typeTextInInput(commentTextArea, text);
    }

    async clickOnSaveCommentButton(text) {
        let saveButton = XPATH.issueCommentsListItemByText(text) + `//button[contains(@id,'Button') and child::span[text()='Save']]`;
        await this.clickOnElement(saveButton);
        return await this.pause(500);
    }

    async clickOnEditCommentMenuItem(text) {
        let selector = XPATH.issueCommentsListItemByText(text) + `//h6/i[contains(@class,'icon-menu')]`;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        //clicks on menu and opens menu items
        await this.clickOnElement(selector);
        await this.pause(700);
        let editMenuItem = `//li[contains(@id,'MenuItem') and text()='Edit']`;
        let elems = await this.getDisplayedElements(editMenuItem);
        await elems[0].click();
        await this.pause(500);
    }

    async clickOnDeleteCommentMenuItem(text) {
        let selector = XPATH.issueCommentsListItemByText(text) + `//h6/i[contains(@class,'icon-menu')]`;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        await this.clickOnElement(selector);
        await this.pause(500);
        let deleteMenuItem = `//li[contains(@id,'MenuItem') and text()='Delete']`;
        let elems = await this.getDisplayedElements(deleteMenuItem);
        await elems[0].click();
        await this.pause(500);
    }

    waitForCommentAndCloseRequestButtonDisplayed() {
        return this.waitForElementDisplayed(this.commentAndCloseRequestButton, appConst.shortTimeout).catch(err => {
            throw new Error('Comments Tab   ' + err);
        })
    }

    waitForCommentAndCloseIssueButtonDisplayed() {
        return this.waitForElementDisplayed(this.commentAndCloseIssueButton, appConst.shortTimeout).catch(err => {
            throw  new Error('Comments Tab   ' + err);
        })
    }

    waitForCommentButtonDisabled() {
        return this.waitForElementDisabled(this.commentButton, appConst.shortTimeout).catch(err => {
            throw  new Error('Issue Details Dialog  ' + err);
        })
    }

    waitForNoCommentsYetMessageDisplayed() {
        let locator = XPATH.commentsList + XPATH.noCommentsMessage;
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    waitForNoCommentsYetMessageNotDisplayed() {
        let locator = XPATH.commentsList + XPATH.noCommentsMessage;
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = IssueDetailsDialogCommentsTab;
