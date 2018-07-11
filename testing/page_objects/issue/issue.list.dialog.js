const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'IssueListDialog')]`,
    newIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='New Issue...']]`,
    showClosedIssuesLink: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Show closed issues')]]",
    showOpenIssuesLink: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Show open issues')]]",
    issueByName: function (name) {
        return `//li[contains(@id,'IssueListItem')]//h6[contains(@class,'main-name') and contains(.,'${name}')]`
    },
};
const issuesListDialog = Object.create(page, {

    title: {
        get: function () {
            return `${xpath.container}//h2[@class='title']`;
        }
    },
    myOpenedIssuesCheckbox: {
        get: function () {
            return `${xpath.container}` +
                   `//div[contains(@class,'panel OPEN')]//div[contains(@id,'Checkbox') and descendant::label[contains(.,'My Issues')]]`;
        }
    },
    showClosedIssuesLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.showClosedIssuesLink}`;
        }
    },
    showOpenIssuesLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.showOpenIssuesLink}`;
        }
    },
    newIssueButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.newIssueButton}`;
        }
    },
    cancelTopButton: {
        get: function () {
            return `${xpath.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },

    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(this.newIssueButton, appConst.TIMEOUT_2);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_2);
        }
    },
    isDialogPresent: {
        value: function () {
            return this.isVisible(`${xpath.container}`);
        }
    },
    clickOnCancelTopButton: {
        value: function () {
            return this.doClick(this.cancelTopButton);
        }
    },
    clickOnNewIssueButton: {
        value: function () {
            return this.doClick(this.newIssueButton).catch(err => {
                this.saveScreenshot('err_click_issue_list_new');
                throw  new Error('Error when click on the `New Issue`  ' + err);
            })
        }
    },
    getTitle: {
        value: function () {
            return this.getText(this.title);
        }
    },
    isNewIssueButtonVisible: {
        value: function () {
            return this.isVisible(this.newIssueButton);
        }
    },
    isMyOpenedIssuesCheckboxVisible: {
        value: function () {
            return this.isVisible(this.myOpenedIssuesCheckbox);
        }
    },
    isShowClosedIssuesLinkVisible: {
        value: function () {
            return this.isVisible(this.showClosedIssuesLink);
        }
    },
    waitForShowOpenIssuesLinkVisible: {
        value: function () {
            return this.waitForVisible(this.showOpenIssuesLink);
        }
    },
    clickOnShowClosedIssuesLink: {
        value: function () {
            return this.doClick(this.showClosedIssuesLink).pause(400).catch(err => {
                this.saveScreenshot('err_issue_list_click_show_closed_issues');
                throw new Error('Error when clicking on `Show closed issues` ' + err)
            })
        }
    },
    isIssuePresent: {
        value: function (issueName) {
            let issueXpath = xpath.issueByName(issueName);
            return this.waitForVisible(issueXpath).catch(err => {
                this.saveScreenshot("issue_not_present_" + issueName);
                return false;
            })
        }
    },
    scrollToIssue: {
        value: function (issueName) {
            let issueXpath = xpath.issueByName(issueName);
            //TODO implement it.
            //return this.element(issueXpath).then(elem => {
            //     return elem.scroll();
            //})
        }
    },
    clickOnIssue: {
        value: function (issueName) {
            let issueXpath = xpath.issueByName(issueName);
            return this.isVisible(issueXpath).then(result => {
                let selector = `div[@class='modal-dialog-body mask-wrapper']`;
                if (!result) {
                    return this.scrollToIssue(issueXpath);
                }
            }).then(() => {
                return this.doClick(issueXpath);
            }).catch(err => {
                this.saveScreenshot('err_click_on_issue');
                throw new Error('error when clicked on issue' + err)
            })
        }
    },
});
module.exports = issuesListDialog;
