const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'IssueListDialog')]`,
    newIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='New Issue...']]`,
    showClosedIssuesButton: "//button[contains(@id,'OnOffButton') and child::span[contains(.,'Show closed issues')]]",
    hideClosedIssuesButton: "//button[contains(@id,'OnOffButton') and child::span[contains(.,'Hide closed issues')]]",
    issueByName: function (name) {
        return `//li[contains(@id,'IssueListItem')]//h6[contains(@class,'main-name') and contains(.,'${name}')]`
    },
    assignedOption: function (name) {
        return `//div[contains(@class,'slick-row') and descendant::div[contains(@id,'RowOptionDisplayValueViewer') and contains(.,''${name}')]]`
    },
    publishRequestsTab: "//li[contains(@id,'api.ui.tab.TabBarItem')and child::a[ contains(.,'Publish requests')]]",
    allIssuesTab: "//li[contains(@id,'api.ui.tab.TabBarItem') and child::a[contains(.,'All')]]",
    issuesTab: "//li[contains(@id,'api.ui.tab.TabBarItem') and child::a[ contains(.,'Issues')]]",
    assignedSelector: "//div[contains(@id,'RowSelector')]",
    assignedSelectedOption: "//div[contains(@class,'selected-options')]"
};

class IssuesListDialog extends Page {

    get title() {
        return xpath.container + `//h2[@class='title']`;
    }

    get assignedDropDownHandle() {
        return xpath.container + xpath.assignedSelector + lib.DROP_DOWN_HANDLE;
    }

    get assignedDOptionsFilterInput() {
        return xpath.container + xpath.assignedSelector + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get publishRequestsTab() {
        return xpath.container + xpath.publishRequestsTab;
    }

    get issuesTab() {
        return xpath.container + xpath.issuesTab;
    }

    get allIssuesTab() {
        return xpath.container + xpath.allIssuesTab;
    }

    get showClosedIssuesButton() {
        return xpath.container + xpath.showClosedIssuesButton;
    }

    get hideClosedIssuesButton() {
        return xpath.container + xpath.hideClosedIssuesButton;
    }

    get newIssueButton() {
        return xpath.container + xpath.newIssueButton;
    }

    get cancelTopButton() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.allIssuesTab, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_load_issues_list_dlg");
            throw new Error("Issues list dialog is not loaded in " + appConst.TIMEOUT_3)
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

    clickOnPublishRequestsTab() {
        return this.clickOnElement(this.publishRequestsTab);
    }

    clickOnIssuesTab() {
        return this.clickOnElement(this.issuesTab);
    }

    clickOnAllIssuesTab() {
        return this.clickOnElement(this.allIssuesTab);
    }

    clickOnNewIssueButton() {
        return this.clickOnElement(this.newIssueButton).catch(err => {
            this.saveScreenshot('err_click_issue_list_new');
            throw  new Error('Error when click on the `New Issue`  ' + err);
        })
    }

    isPublishRequestsTabDisplayed() {
        return this.isElementDisplayed(this.publishRequestsTab);
    }

    isAllIssuesTabDisplayed() {
        return this.isElementDisplayed(this.allIssuesTab);
    }

    isIssuesTabDisplayed() {
        return this.isElementDisplayed(this.issuesTab);
    }

    getTitle() {
        return this.getText(this.title);
    }

    isNewIssueButtonVisible() {
        return this.isElementDisplayed(this.newIssueButton);
    }

    async getAssignedSelectedOption() {
        let selector = xpath.assignedSelector + xpath.assignedSelectedOption + "//div[contains(@class,'option-value')]";
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        return await this.getText(selector);
    }

    isShowClosedIssuesButtonVisible() {
        return this.isElementDisplayed(this.showClosedIssuesButton);
    }

    waitForShowClosedIssuesButtonVisible() {
        return this.waitForElementDisplayed(this.showClosedIssuesButton);
    }

    waitForHideClosedIssuesButtonVisible() {
        return this.waitForElementDisplayed(this.hideClosedIssuesButton);
    }

    async clickOnShowClosedIssuesButton() {
        await this.clickOnElement(this.showClosedIssuesButton);
        return await this.pause(400);
    }

    //clicks on dropdown handle and selects required option
    async selectAssigned(option) {
        await this.clickOnElement(this.assignedDropDownHandle);
        let optionXpath = xpath.assignedOption(option);
        await this.waitForElementDisplayed(optionXpath);
        await this.clickOnElement(optionXpath);
    }

    //filters and selects required option
    async selectAssigned(option) {
        await this.typeTextInInput(this.assignedDOptionsFilterInput);
        let optionXpath = xpath.assignedOption(option);
        await this.waitForElementDisplayed(optionXpath);
        await this.clickOnElement(optionXpath);
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
