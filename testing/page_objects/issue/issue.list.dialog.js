const Page = require('../page');
const lib = require('../../libs/elements');
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

class IssuesListDialog extends Page {

    get title() {
        return xpath.container + `//h2[@class='title']`;
    }

    get myOpenedIssuesCheckbox() {
        return xpath.container +
               `//div[contains(@class,'panel OPEN')]//div[contains(@id,'Checkbox') and descendant::label[contains(.,'My Issues')]]`;
    }

    get showClosedIssuesLink() {
        return xpath.container + xpath.showClosedIssuesLink;
    }

    get showOpenIssuesLink() {
        return xpath.container + xpath.showOpenIssuesLink;
    }

    get newIssueButton() {
        return xpath.container + xpath.newIssueButton;
    }

    get cancelTopButton() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.newIssueButton, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_load_issues_list_dlg");
            throw new Error("Issues list dialog not loaded in " + appConst.TIMEOUT_3)
        })
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.TIMEOUT_2);
    }

    isDialogPresent() {
        return this.isElementDisplayed(xpath.container);
    }

    clickOnCancelTopButton() {
        return this.clickOnElement(this.cancelTopButton);
    }

    clickOnNewIssueButton() {
        return this.clickOnElement(this.newIssueButton).catch(err => {
            this.saveScreenshot('err_click_issue_list_new');
            throw  new Error('Error when click on the `New Issue`  ' + err);
        })
    }

    getTitle() {
        return this.getText(this.title);
    }

    isNewIssueButtonVisible() {
        return this.isElementDisplayed(this.newIssueButton);
    }

    isMyOpenedIssuesCheckboxVisible() {
        return this.isElementDisplayed(this.myOpenedIssuesCheckbox);
    }

    isShowClosedIssuesLinkVisible() {
        return this.isElementDisplayed(this.showClosedIssuesLink);
    }

    waitForShowOpenIssuesLinkVisible() {
        return this.waitForElementDisplayed(this.showOpenIssuesLink);
    }

    async clickOnShowClosedIssuesLink() {
        await this.waitForElementDisplayed(this.showClosedIssuesLink,appConst.TIMEOUT_3);
        await this.clickOnElement(this.showClosedIssuesLink);
        return await this.pause(400);
    }

    isIssuePresent(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        return this.waitForElementDisplayed(issueXpath).catch(err => {
            this.saveScreenshot("issue_not_present_" + issueName);
            return false;
        })
    }

    scrollToIssue(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        //TODO implement it.
        //return this.element(issueXpath).then(elem => {
        //     return elem.scroll();
        //})
    }

    clickOnIssue(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        return this.isElementDisplayed(issueXpath).then(result => {
            let selector = `div[@class='modal-dialog-body mask-wrapper']`;
            if (!result) {
                return this.scrollToIssue(issueXpath);
            }
        }).then(() => {
            return this.clickOnElement(issueXpath);
        }).catch(err => {
            this.saveScreenshot('err_click_on_issue');
            throw new Error('error when clicked on issue' + err)
        })
    }
};
module.exports = IssuesListDialog;
