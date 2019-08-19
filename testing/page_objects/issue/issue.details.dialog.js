const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    toIssueList: `//a[@title='To Issue List']`,
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    editIssueTitleToggle: `//h2[@class='inplace-text' and @title='Click to  edit']`,
    closeIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Close Issue']]`,
    reopenIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Issue']]`,
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

class IssueDetailsDialog extends Page {

    get closeIssueButton() {
        return XPATH.container + XPATH.closeIssueButton;
    }

    get backButton() {
        return XPATH.container + XPATH.toIssueList;
    }

    get titleInput() {
        return XPATH.container + XPATH.issueNameInPlaceInput + '//input';
    }

    get issueTitleInputToggle() {
        return XPATH.issueNameInPlaceInput + XPATH.editIssueTitleToggle;
    }

    get issueStatusSelector() {
        return XPATH.container + XPATH.issueStatusSelector;
    }

    get reopenIssueButton() {
        return XPATH.container + XPATH.reopenIssueButton;
    }

    get commentButton() {
        return XPATH.container + XPATH.commentButton;
    }

    get issueCommentTextArea() {
        return XPATH.container + XPATH.issueCommentTextArea + lib.TEXT_AREA;
    }

    get itemsTabBarItem() {
        return XPATH.container + XPATH.itemsTabBarItem;
    }

    get commentsTabBarItem() {
        return XPATH.container + XPATH.commentsTabBarItem;
    }

    get assigneesTabBarItem() {
        return XPATH.container + XPATH.assigneesTabBarItem;
    }

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
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

    isNoActionLabelPresent() {
        return this.isElementDisplayed(XPATH.noActionLabel);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    async clickOnCancelTopButton() {
        await this.waitForElementDisplayed(this.cancelTopButton);
        await this.clickOnElement(this.cancelTopButton);
        return await this.pause(300);
    }

    clickOnIssueStatusSelector() {
        return this.clickOnElement(this.issueStatusSelector);
    }

    clickOnBackButton() {
        return this.clickOnElement(this.backButton);
    }

    async clickOnEditTitle() {
        await this.clickOnElement(this.issueTitleInputToggle);
        return await this.pause(500);
    }

    async typeTitle(title) {
        try {
            await this.typeTextInInput(this.titleInput, title);
            await this.pause(400);
        } catch (err) {
            this.saveScreenshot("err_type_issue_title");
            throw new Error('error when type issue-title ' + err);
        }
    }


    waitForIssueTitleInputNotEditable() {
        return this.getBrowser().waitUntil(() => {
            return this.isElementDisplayed(`//div[contains(@id,'IssueDetailsInPlaceTextInput') and contains (@class,'readonly')]`);
        }, appConst.TIMEOUT_3, "Issue details dialog - title should not be editable!");

    }

    async clickOnIssueStatusSelectorAndCloseIssue() {
        let menuItemSelector = XPATH.issueStatusMenuItem('Closed');
        await this.clickOnElement(this.issueStatusSelector);
        await this.waitForElementDisplayed(menuItemSelector, appConst.TIMEOUT_2);
        await this.clickOnElement(menuItemSelector);
        return await this.pause(300);
    }

    async clickOnIssueStatusSelectorAndOpenIssue() {
        let menuItemSelector = XPATH.issueStatusMenuItem('Open');
        await this.clickOnElement(this.issueStatusSelector);
        await this.waitForElementDisplayed(menuItemSelector, appConst.TIMEOUT_2);
        await this.clickOnElement(menuItemSelector);
        return await this.pause(300);
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

    clickOnCloseIssueButton() {
        return this.clickOnElement(this.closeIssueButton).catch(err => {
            this.saveScreenshot('err_click_close_issue_button');
            throw  new Error('Error when clicking on the `Close Issue`  ' + err);
        }).then(() => {
            return this.waitForElementDisplayed(this.reopenIssueButton, appConst.TIMEOUT_4).catch(err => {
                this.saveScreenshot('err_issue_closed');
                throw new Error('Close button has been clicked, but `Reopen Issue` button is not appeared');
            })
        })
    }

    async clickOnReopenIssueButton() {
        await this.clickOnElement(this.reopenIssueButton);
        await this.pause(300);
    }

    pressEscKey() {
        return this.getBrowser().keys(['Escape']);
    }

    isCloseIssueButtonDisplayed() {
        return this.isElementDisplayed(this.closeIssueButton);
    }

    isCommentButtonDisplayed() {
        return this.isElementDisplayed(this.commentButton);
    }

    async clickOnCommentButton() {
        await this.clickOnElement(this.commentButton);
        return await this.pause(500);
    }

    isCommentTextAreaDisplayed() {
        return this.isElementDisplayed(this.issueCommentTextArea);
    }

    isCommentButtonEnabled() {
        return this.isElementEnabled(this.commentButton);
    }

    waitForCommentButtonEnabled() {
        return this.waitForElementEnabled(this.commentButton).catch(err => {
            throw  new Error('Issue Details Dialog  ' + err);
        })
    }

    waitForCommentButtonDisabled() {
        return this.waitForElementDisabled(this.commentButton).catch(err => {
            throw  new Error('Issue Details Dialog  ' + err);
        })
    }

    async getIssueTitle() {
        let result = await this.getText(XPATH.issueNameInPlaceInput + '/h2');
        let endIndex = result.indexOf('#');
        return result.substring(0, endIndex).trim();
    }

    typeComment(text) {
        return this.typeTextInInput(this.issueCommentTextArea, text);
    }

    isCommentPresent(text) {
        let selector = XPATH.issueCommentsListItemByText(text);
        return this.isElementDisplayed(selector);
    }

    updateComment(comment, text) {
        let commentTextarea = XPATH.issueCommentsListItemByText(comment) + `//textarea`;
        return this.typeTextInInput(commentTextarea, text);
    }

    async clickOnSaveCommentButton(text) {
        let saveButton = XPATH.issueCommentsListItemByText(text) + `//button[contains(@id,'Button') and child::span[text()='Save']]`;
        await this.clickOnElement(saveButton);
        return await this.pause(500);
    }

    async getNumberOfItemsInTabMenuBar() {
        let result = await this.getText(this.itemsTabBarItem);
        let startIndex = result.indexOf('(');
        if (startIndex == -1) {
            return undefined;
        }
        let endIndex = result.indexOf(')');
        return result.substring(startIndex + 1, endIndex);
    }

    isCommentsTabBarItemActive() {
        return this.getAttribute(this.commentsTabBarItem, 'class').then(result => {
            return result.includes('active');
        }).catch(err => {
            throw  new Error('Issue Details Dialog  ' + err);
        })
    }

    async clickOnCommentsTabBarItem() {
        await this.clickOnElement(this.commentsTabBarItem);
        return await this.pause(400);
    }

    isItemsTabBarItemActive() {
        return this.getAttribute(this.itemsTabBarItem, 'class').then(result => {
            return result.includes('active');
        }).catch(err => {
            throw  new Error('Issue Details Dialog  ' + err);
        })
    }

    clickOnItemsTabBarItem(text) {
        return this.waitForElementDisplayed(this.itemsTabBarItem, appConst.TIMEOUT_2).then(() => {
            return this.clickOnElement(this.itemsTabBarItem);
        }).catch(err => {
            this.saveScreenshot('err_click_on_items_tabbar_item');
            throw new Error('Issue Details Dialog:error when click on Items tab bar item: ' + err)
        }).then(() => {
            return this.pause(500);
        });
    }

    async clickOnEditCommentMenuItem(text) {
        let selector = XPATH.issueCommentsListItemByText(text) + `//h6/i[contains(@class,'icon-menu')]`;
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
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
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        await this.clickOnElement(selector);
        await this.pause(500);
        let deleteMenuItem = `//li[contains(@id,'MenuItem') and text()='Delete']`;
        let elems = await this.getDisplayedElements(deleteMenuItem);
        await elems[0].click();
        await this.pause(500);
    }
};
module.exports = IssueDetailsDialog;
