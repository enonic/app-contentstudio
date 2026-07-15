const Page = require('../page');
const {BUTTONS, COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='IssueDialogDetailsContent']`,
    commentAndCloseRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment & Close Request']]`,
    commentAndCloseIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment & Close Issue']]`,
    commentsPanelDiv: `//div[@role='tabpanel' and contains(@id,'comments')]`,
    noCommentsMessage: "//div[text()='No comments yet']",
    reopenRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Request']]`,
    commentsListDiv: "//div[@data-component='IssueCommentsList']",
    issueCommentsListItemByText:
        text => XPATH.commentsListDiv + `//div[@data-component='IssueCommentItem' and descendant::div[text()='${text}']]`,
    // in the edit mode the comment text is shown in the textarea, so the item can not be located by its text:
    commentItemInEditMode: "//div[@data-component='IssueCommentItem' and descendant::textarea[@aria-label='Comment']]",
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

    isCommentDisplayed(text) {
        let selector = XPATH.issueCommentsListItemByText(text);
        return this.isElementDisplayed(selector);
    }

    isCommentButtonEnabled() {
        return this.isElementEnabled(this.commentButton);
    }

    // clears the textarea of the comment that is being edited then types the new text (Edit menu item should be clicked before):
    async updateComment(text) {
        try {
            let commentTextArea = XPATH.commentsListDiv + XPATH.commentItemInEditMode + '//textarea';
            await this.waitForElementDisplayed(commentTextArea, appConst.shortTimeout);
            await this.clearInputText(commentTextArea);
            return await this.typeTextInInput(commentTextArea, text);
        } catch (err) {
            await this.handleError('Comments Tab - error when updating the comment', 'err_update_comment', err);
        }
    }

    // clicks on 'Save' button in the comment that is being edited:
    async clickOnSaveCommentButton() {
        try {
            let saveButton = XPATH.commentsListDiv + XPATH.commentItemInEditMode + BUTTONS.buttonByLabel('Save');
            await this.waitForElementDisplayed(saveButton, appConst.shortTimeout);
            await this.clickOnElement(saveButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Comments Tab - error when clicking on 'Save' button in the comment`, 'err_save_comment', err);
        }
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
        let menuButton = XPATH.issueCommentsListItemByText(text) + BUTTONS.BUTTON_MENU_POPUP;
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

    async waitForCommentButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.commentButton, appConst.shortTimeout)
        } catch (err) {
          await this.handleError('Comments Tab, Comment button should be disabled', 'err_comment_btn_disabled', err);
        }
    }

    async waitForNoCommentsYetMessageDisplayed() {
        try {
            let locator = XPATH.commentsListDiv + XPATH.noCommentsMessage;
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Comments Tab, wait for "No comments yet" message displayed', 'err_no_comments_message', err);
        }
    }

    async waitForNoCommentsYetMessageNotDisplayed() {
        try {
            let locator = XPATH.commentsListDiv + XPATH.noCommentsMessage;
            return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Comments Tab, wait for "No comments yet" message not displayed', 'err_no_comments_msg', err);
        }
    }
}

module.exports = IssueDetailsDialogCommentsTab;
