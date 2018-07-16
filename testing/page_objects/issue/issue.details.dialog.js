const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    toIssueList: `//a[@title='To Issue List']`,
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    issueTitleInputToggle: `//button[@class='inplace-toggle']`,
    closeIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Close Issue']]`,
    reopenIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Issue']]`,
    addCommentButton: `//button[contains(@id,'DialogButton') and child::span[text()='Add Comment']]`,
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
const issueDetailsDialog = Object.create(page, {

    closeIssueButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.closeIssueButton}`;
        }
    },
    backButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.toIssueList}`;
        }
    },
    titleInput: {
        get: function () {
            return `${xpath.container}` + `${xpath.issueNameInPlaceInput}` + '//input';
        }
    },
    issueTitleInputToggle: {
        get: function () {
            return `${xpath.issueNameInPlaceInput}` + `${xpath.issueTitleInputToggle}`;
        }
    },
    issueStatusSelector: {
        get: function () {
            return `${xpath.container}` + `${xpath.issueStatusSelector}`;
        }
    },
    reopenIssueButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.reopenIssueButton}`;
        }
    },
    addCommentButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.addCommentButton}`;
        }
    },
    issueCommentTextArea: {
        get: function () {
            return `${xpath.container}` + `${xpath.issueCommentTextArea}` + `${elements.TEXT_AREA}`;
        }
    },
    itemsTabBarItem: {
        get: function () {
            return `${xpath.container}` + `${xpath.itemsTabBarItem}`;
        }
    },
    commentsTabBarItem: {
        get: function () {
            return `${xpath.container}` + `${xpath.commentsTabBarItem}`;
        }
    },
    assigneesTabBarItem: {
        get: function () {
            return `${xpath.container}` + `${xpath.assigneesTabBarItem}`;
        }
    },

    cancelTopButton: {
        get: function () {
            return `${xpath.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },

    waitForDialogLoaded: {
        value: function () {
            return this.waitForVisible(`${xpath.issueNameInPlaceInput}`, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Issue Details dialog is not loaded ' + err)
            });
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_close_is_det_dialog');
                throw new Error('Issue Details Dialog should be closed! ' + err)
            })
        }
    },
    getNumberOfItems: {
        value: function () {
            let xpath = this.itemsTabBarItem + '/a';
            return this.getText(xpath).then(result => {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            })
        }
    },
    isNoActionLabelPresent: {
        value: function () {
            return this.isVisible(`${xpath.noActionLabel}`);
        }
    },
    isDialogOpened: {
        value: function () {
            return this.isVisible(`${xpath.container}`);
        }
    },
    clickOnCancelTopButton: {
        value: function () {
            return this.doClick(this.cancelTopButton).pause(500);
        }
    },
    clickOnIssueStatusSelector: {
        value: function () {
            return this.doClick(this.issueStatusSelector);
        }
    },
    clickOnBackButton: {
        value: function () {
            return this.doClick(this.backButton);
        }
    },
    clickOnIssueTitleInputToggle: {
        value: function () {
            return this.doClick(this.issueTitleInputToggle).pause(500);
        }
    },
    typeTitle: {
        value: function (title) {
            return this.typeTextInInput(this.titleInput, title).catch(err => {
                this.saveScreenshot("err_type_issue_title");
                throw new Error('error when type issue-title ' + err);
            })
        }
    },
    waitForIssueTitleInputToggleLoaded: {
        value: function () {
            return this.waitForVisible(`${xpath.issueTitleInputToggle}`, appConst.TIMEOUT_5).catch(err => {
                throw new Error('Issue Details dialog- `Title Input toggler` should be loaded! ' + err)
            });
        }
    },
    waitForIssueTitleInputToggleNotVisible: {
        value: function () {
            return this.waitForNotVisible(`${xpath.issueTitleInputToggle}`, appConst.TIMEOUT_5).catch(err => {
                throw new Error('Issue Details dialog- `Title Input toggler` should be not visible! ' + err)
            });
        }
    },
    clickOnIssueStatusSelectorAndCloseIssue: {
        value: function () {
            let menuItemSelector = xpath.issueStatusMenuItem('Closed');
            return this.doClick(this.issueStatusSelector).then(() => {
                return this.waitForVisible(menuItemSelector, appConst.TIMEOUT_2);
            }).then(() => {
                return this.doClick(menuItemSelector);
            })
        }
    },
    clickOnIssueStatusSelectorAndOpenIssue: {
        value: function () {
            let menuItemSelector = xpath.issueStatusMenuItem('Open');
            return this.doClick(this.issueStatusSelector).then(() => {
                return this.waitForVisible(menuItemSelector, appConst.TIMEOUT_2);
            }).then(() => {
                return this.doClick(menuItemSelector);
            })
        }
    },
    waitForReopenButtonLoaded: {
        value: function () {
            return this.waitForVisible(`${xpath.reopenIssueButton}`, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Issue Details dialog `Reopen button` is not loaded ' + err)
            });
        }
    },
    waitForCloseButtonLoaded: {
        value: function () {
            return this.waitForVisible(`${xpath.closeIssueButton}`, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Issue Details dialog `Close button` is not loaded ' + err)
            });
        }
    },
    clickOnCloseIssueButton: {
        value: function () {
            return this.doClick(this.closeIssueButton).catch(err => {
                this.saveScreenshot('err_click_close_issue_button');
                throw  new Error('Error when clicking on the `Close Issue`  ' + err);
            }).then(() => {
                return this.waitForVisible(this.reopenIssueButton, appConst.TIMEOUT_2).catch(err => {
                    this.saveScreenshot('err_issue_closed');
                    throw new Error('Close button has been clicked, but `Reopen Issue` button is not appeared');
                })
            })
        }
    },
    clickOnReopenIssueButton: {
        value: function () {
            return this.doClick(this.reopenIssueButton).catch(err => {
                this.saveScreenshot('err_click_reopen_issue_button');
                throw  new Error('Error when clicking on the `Close Issue`  ' + err);
            })
        }
    },
    pressEscKey: {
        value: function () {
            return this.getBrowser().keys(['Escape']);
        }
    },
    isCloseIssueButtonDisplayed: {
        value: function () {
            return this.isVisible(this.closeIssueButton).catch(err => {
                this.saveScreenshot('err_visible_close_issue_button');
                throw  new Error('Issue Details Dialog: ' + err);
            })
        }
    },
    clickOnAddCommentButton: {
        value: function () {
            return this.doClick(this.addCommentButton).catch(err => {
                this.saveScreenshot('err_click_add_comment_button');
                throw  new Error('Error when clicking on the `Add Comment`  ' + err);
            })
        }
    },
    isAddCommentButtonDisplayed: {
        value: function () {
            return this.isVisible(this.addCommentButton).catch(err => {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isCommentTextAreaDisplayed: {
        value: function () {
            return this.isVisible(this.issueCommentTextArea).catch(err => {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isAddCommentButtonEnabled: {
        value: function () {
            return this.isEnabled(this.addCommentButton).catch(err => {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    waitForAddCommentButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.addCommentButton).catch(err => {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    waitForAddCommentButtonDisabled: {
        value: function () {
            return this.waitForDisabled(this.addCommentButton).catch(err => {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isCommentsTabBarItemActive: {
        value: function () {
            return this.getAttribute(this.commentsTabBarItem, 'class').then(result => {
                return result.includes('active');
            }).catch(err => {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isItemsTabBarItemActive: {
        value: function () {
            return this.getAttribute(this.itemsTabBarItem, 'class').then(result => {
                return result.includes('active');
            }).catch(err => {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },

    getIssueTitle: {
        value: function () {
            return this.getText(`${xpath.issueNameInPlaceInput}/h2`).then(result => {
                let endIndex = result.indexOf('#');
                return result.substring(0, endIndex).trim();

            })
        }
    },
    typeComment: {
        value: function (text) {
            return this.typeTextInInput(this.issueCommentTextArea, text).catch(err => {
                this.saveScreenshot('err_type_text_in_area');
                throw new Error('error type text in issue comment: ' + err)
            })
        }
    },
    isCommentPresent: {
        value: function (text) {
            let selector = xpath.issueCommentsListItemByText(text);
            return this.isVisible(selector).catch(err => {
                this.saveScreenshot('err_get_comment_issue');
                throw new Error('error when get issue comment: ' + err)
            })
        }
    },
    clickOnItemsTabBarItem: {
        value: function (text) {
            return this.doClick(this.itemsTabBarItem).pause(500).catch(err => {
                this.saveScreenshot('err_click_on_items_tabbar_item');
                throw new Error('Issue Details Dialog:error when click on Items tab bar item: ' + err)
            })
        }
    },
    clickOnEditCommentMenuItem: {
        value: function (text) {
            let selector = xpath.issueCommentsListItemByText(text) + `//h6/i[contains(@class,'icon-menu')]`;
            return this.doClick(selector).pause(500).then(() => {
                let editMenuItem = `//li[contains(@id,'MenuItem') and text()='Edit']`;
                return this.getDisplayedElements(editMenuItem);
            }).then((result) => {
                return this.getBrowser().elementIdClick(result[0].ELEMENT);
            }).pause(500).catch(err => {
                this.saveScreenshot('err_click_on_edit_comment_issue');
                throw new Error('error when click on edit the issue comment: ' + err)
            })
        }
    },
    clickOnDeleteCommentMenuItem: {
        value: function (text) {
            let selector = xpath.issueCommentsListItemByText(text) + `//h6/i[contains(@class,'icon-menu')]`;
            return this.doClick(selector).pause(500).then(() => {
                let deleteMenuItem = `//li[contains(@id,'MenuItem') and text()='Delete']`;
                return this.getDisplayedElements(deleteMenuItem);
            }).then((result) => {
                return this.getBrowser().elementIdClick(result[0].ELEMENT);
            }).pause(500).catch(err => {
                this.saveScreenshot('err_click_on_delete_comment');
                throw new Error('error when click on delete the issue comment: ' + err)
            })
        }
    },
    updateComment: {
        value: function (comment, text) {
            let commentTextarea = xpath.issueCommentsListItemByText(comment) + `//textarea`;
            return this.typeTextInInput(commentTextarea, text).catch(err => {
                throw new Error('error type text in issue comment: ' + err)
            })
        }
    },
    clickOnSaveCommentButton: {
        value: function (text) {
            let saveButton = xpath.issueCommentsListItemByText(text) + `//button[contains(@id,'Button') and child::span[text()='Save']]`;
            return this.doClick(saveButton).pause(500).catch(err => {
                throw new Error('error when save the issue comment: ' + err)
            })
        }
    },
    getNumberOfItemsInTabMenuBar: {
        value: function () {
            return this.getText(this.itemsTabBarItem).then(result => {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            }).catch(err => {
                throw new Error('error when getting number from the Items(...) link ' + err);
            });
        }
    },
});
module.exports = issueDetailsDialog;
