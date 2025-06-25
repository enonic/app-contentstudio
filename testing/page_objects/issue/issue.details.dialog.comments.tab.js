const Page = require('../page');
const {BUTTONS, COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='IssueDialogDetailsContent']`,
    commentAndCloseRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment & Close Request']]`,
    commentAndCloseIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment & Close Issue']]`,
    commentsPanelDiv: `//div[@role='tabpanel' and contains(@id,'comments')]`,
    noCommentsMessage: "//h5[@class='empty-list-item']",
    reopenRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Request']]`,
    commentsListDiv: "//div[@data-component='IssueCommentsList']",
    issueCommentsListItemByText:
        text => XPATH.commentsListDiv + `//div[@data-component='IssueCommentItem') and descendant::div[text()='${text}']]`,
};

class IssueDetailsDialogCommentsTab extends Page {

    get reopenRequestButton() {
        return XPATH.container + XPATH.reopenRequestButton;
    }

    get issueCommentTextArea() {
        return XPATH.container + XPATH.commentsPanelDiv + COMMON.INPUTS.textAreaByName('comment');
    }

    get commentButton() {
        return XPATH.container + COMMON.FOOTER_ELEMENT + BUTTONS.buttonByLabel('Comment');
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

    async waitForCommentButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.commentButton, appConst.mediumTimeout)
        } catch (err) {
            throw new Error('Issue Details Dialog,Comments tab  ' + err);
        }
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
        let saveButton = XPATH.issueCommentsListItemByText(text) + BUTTONS.buttonByLabel('Save');
        await this.clickOnElement(saveButton);
        return await this.pause(300);
    }

    async clickOnEditCommentMenuItem(text) {
        let menuButton = XPATH.issueCommentsListItemByText(text) + BUTTONS.BUTTON_MENU_POPUP;
        await this.waitForElementDisplayed(menuButton, appConst.shortTimeout);
        //click on menu button then click on menu item
        await this.clickOnElement(menuButton);
        await this.pause(300);
        let editMenuItem = COMMON.menuItemByText('Edit');
        let elems = await this.getDisplayedElements(editMenuItem);
        await elems[0].click();
        await this.pause(300);
    }

    async clickOnDeleteCommentMenuItem(text) {
        let menuButton = XPATH.issueCommentsListItemByText(text) +  BUTTONS.BUTTON_MENU_POPUP;
        await this.waitForElementDisplayed(menuButton, appConst.shortTimeout);
        // click on menu button then click on menu item
        await this.clickOnElement(menuButton);
        await this.pause(300);
        let deleteMenuItem = COMMON.menuItemByText('Delete');
        let elems = await this.getDisplayedElements(deleteMenuItem);
        await elems[0].click();
        await this.pause(300);
    }

    waitForCommentAndCloseRequestButtonDisplayed() {
        return this.waitForElementDisplayed(this.commentAndCloseRequestButton, appConst.shortTimeout).catch(err => {
            throw new Error('Comments Tab   ' + err);
        })
    }

    async clickOnCommentAndCloseRequestButton() {
        await this.clickOnElement(this.commentAndCloseRequestButton);
        return await this.pause(500);
    }

    async waitForReopenRequestButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.reopenRequestButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_reopen_request_button');
            throw new Error(`Reopen Request button is not displayed, screenshot ${screenshot} ` + err);
        }
    }

    waitForCommentAndCloseIssueButtonDisplayed() {
        return this.waitForElementDisplayed(this.commentAndCloseIssueButton, appConst.shortTimeout).catch(err => {
            throw new Error('Comments Tab   ' + err);
        })
    }

    waitForCommentButtonDisabled() {
        return this.waitForElementDisabled(this.commentButton, appConst.shortTimeout).catch(err => {
            throw new Error('Issue Details Dialog  ' + err);
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
