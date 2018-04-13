const page = require('../page');
const elements = require('../../libs/elements');
const xpath = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    closeIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Close Issue']]`,
    addCommentButton: `//button[contains(@id,'DialogButton') and child::span[text()='Add Comment']]`,
    itemsTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Items')]]",
    assigneesTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Assignees')]]",
    commentsTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Comments')]]",
    issueStatusSelector: `//div[contains(@id,'IssueStatusSelector')]`,
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    issueCommentsListItem: `//div[contains(@id,'IssueCommentsListItem')]`,
    issueCommentsListItemByText:
        text => `//div[contains(@id,'IssueCommentsListItem') and descendant::p[@class='inplace-text' and text()='${text}']]`,

};
const issueDetailsDialog = Object.create(page, {

    closeIssueButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.closeIssueButton}`;
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
            return this.waitForVisible(this.closeIssueButton, 1000).catch(err=> {
                throw new Error('Issue Details dialog is not loaded ' + err)
            });
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, 1000).catch(err=> {
                this.saveScreenshot('err_close_is_det_dialog');
                throw new Error('Issue Details Dialog should be closed! ' + err)
            })
        }
    },
    getNumberOfItems: {
        value: function () {
            let xpath = this.itemsTabBarItem + '/a';
            return this.getText(xpath).then(result=> {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            })
        }
    },
    isDialogOpened: {
        value: function () {
            return this.isVisible(`${xpath.container}`);
        }
    },
    clickOnCancelTopButton: {
        value: function () {
            return this.doClick(this.cancelTopButton);
        }
    },
    clickOnCloseIssueButton: {
        value: function () {
            return this.doClick(this.closeIssueButton).catch(err=> {
                this.saveScreenshot('err_click_close_issue_button');
                throw  new Error('Error when clicking on the `Close Issue`  ' + err);
            })
        }
    },
    isCloseIssueButtonDisplayed: {
        value: function () {
            return this.isVisible(this.closeIssueButton).catch(err=> {
                this.saveScreenshot('err_visible_close_issue_button');
                throw  new Error('Issue Details Dialog: ' + err);
            })
        }
    },
    clickOnAddCommentButton: {
        value: function () {
            return this.doClick(this.addCommentButton).catch(err=> {
                this.saveScreenshot('err_click_add_comment_button');
                throw  new Error('Error when clicking on the `Add Comment`  ' + err);
            })
        }
    },
    isAddCommentButtonDisplayed: {
        value: function () {
            return this.isVisible(this.addCommentButton).catch(err=> {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isCommentTextAreaDisplayed: {
        value: function () {
            return this.isVisible(this.issueCommentTextArea).catch(err=> {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isAddCommentButtonEnabled: {
        value: function () {
            return this.isEnabled(this.addCommentButton).catch(err=> {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    waitForAddCommentButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.addCommentButton).catch(err=> {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    waitForAddCommentButtonDisabled: {
        value: function () {
            return this.waitForDisabled(this.addCommentButton).catch(err=> {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isCommentsTabBarItemActive: {
        value: function () {
            return this.getAttribute(this.commentsTabBarItem, 'class').then(result=> {
                return result.includes('active');
            }).catch(err=> {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },
    isItemsTabBarItemActive: {
        value: function () {
            return this.getAttribute(this.itemsTabBarItem, 'class').then(result=> {
                return result.includes('active');
            }).catch(err=> {
                throw  new Error('Issue Details Dialog  ' + err);
            })
        }
    },

    getIssueName: {
        value: function () {
            return `${xpath.issueNameInPlaceInput}//h2`;
        }
    },
    typeComment: {
        value: function (text) {
            return this.typeTextInInput(this.issueCommentTextArea, text).catch(err=> {
                this.saveScreenshot('err_type_text_in_area');
                throw new Error('error type text in issue comment: ' + err)
            })
        }
    },
    isCommentPresent: {
        value: function (text) {
            let selector = xpath.issueCommentsListItemByText(text);
            return this.isVisible(selector).catch(err=> {
                this.saveScreenshot('err_get_comment_issue');
                throw new Error('error when get issue comment: ' + err)
            })
        }
    },
    clickOnItemsTabBarItem: {
        value: function (text) {
            return this.doClick(this.itemsTabBarItem).pause(300).catch(err=> {
                this.saveScreenshot('err_click_on_items_tabbar_item');
                throw new Error('Issue Details Dialog:error when click on Items tab bar item: ' + err)
            })
        }
    },
    clickOnEditCommentMenuItem: {
        value: function (text) {
            let selector = xpath.issueCommentsListItemByText(text) + `//h6/i[contains(@class,'icon-menu')]`;
            return this.doClick(selector).pause(500).then(()=> {
                let editMenuItem = `//li[contains(@id,'MenuItem') and text()='Edit']`;
                return this.getDisplayedElements(editMenuItem);
            }).then((result)=> {
                return this.getBrowser().elementIdClick(result[0].ELEMENT);
            }).pause(500).catch(err=> {
                this.saveScreenshot('err_click_on_edit_comment_issue');
                throw new Error('error when click on edit the issue comment: ' + err)
            })
        }
    },
    clickOnDeleteCommentMenuItem: {
        value: function (text) {
            let selector = xpath.issueCommentsListItemByText(text) + `//h6/i[contains(@class,'icon-menu')]`;
            return this.doClick(selector).pause(500).then(()=> {
                let deleteMenuItem = `//li[contains(@id,'MenuItem') and text()='Delete']`;
                return this.getDisplayedElements(deleteMenuItem);
            }).then((result)=> {
                return this.getBrowser().elementIdClick(result[0].ELEMENT);
            }).pause(500).catch(err=> {
                this.saveScreenshot('err_click_on_delete_comment');
                throw new Error('error when click on delete the issue comment: ' + err)
            })
        }
    },
    updateComment: {
        value: function (comment, text) {
            let commentTextarea = xpath.issueCommentsListItemByText(comment) + `//textarea`;
            return this.typeTextInInput(commentTextarea, text).catch(err=> {
                throw new Error('error type text in issue comment: ' + err)
            })
        }
    },
    clickOnSaveCommentButton: {
        value: function (text) {
            let saveButton = xpath.issueCommentsListItemByText(text) + `//button[contains(@id,'Button') and child::span[text()='Save']]`;
            return this.doClick(saveButton).pause(500).catch(err=> {
                throw new Error('error when save the issue comment: ' + err)
            })
        }
    },
    getNumberOfItemsInTabMenuBar: {
        value: function () {
            return this.getText(this.itemsTabBarItem).then(result=> {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            }).catch(err=> {
                throw new Error('error when getting number from the Items(...) link ' + err);
            });
        }
    },
});
module.exports = issueDetailsDialog;
