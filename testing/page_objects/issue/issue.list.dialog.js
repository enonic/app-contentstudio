const page = require('../page');
const elements = require('../../libs/elements');
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
        value: function (ms) {
            return this.waitForVisible(this.newIssueButton, ms);
        }
    },
    waitForDialogClosed: {
        value: function (ms) {
            return this.waitForNotVisible(`${xpath.container}`, ms);
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
            return this.doClick(this.newIssueButton).catch(err=> {
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
            return this.doClick(this.showClosedIssuesLink).catch(err=> {
                this.doCatch('err_issue_list_show_closed', err)
            })
        }
    },
    clickOnIssue: {
        value: function (issueName) {
            let issueXpath = xpath.issueByName(issueName);
            return this.doClick(issueXpath).catch(err=> {
                this.saveScreenshot('err_click_on_issue');
                throw new Error('error when clicked on issue' + err)
            })
        }
    },
});
module.exports = issuesListDialog;
