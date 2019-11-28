const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'IssueListDialog')]`,
    newTaskButton: `//button[contains(@id,'DialogButton') and child::span[text()='New task']]`,
    closedButton: "//button[contains(@id,'StatusFilterButton') and child::span[contains(.,'Closed')]]",
    openButton: "//button[contains(@id,'StatusFilterButton') and child::span[contains(.,'Open')]]",
    hideClosedIssuesButton: "//button[contains(@id,'OnOffButton') and child::span[contains(.,'Hide closed issues')]]",
    issueByName: function (name) {
        return `//li[contains(@id,'IssueListItem')]//h6[contains(@class,'main-name') and contains(.,'${name}')]`
    },
    typeFilterOption: option => {
        return `//div[contains(@id,'TypeFilter')]//li[contains(@id,'MenuItem')and contains(.,'${option}']] `
    },
    publishRequestsMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'Publish requests']]",
    createdByMeMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'Created by Me']]",
    assignedToMeMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'Assigned to Me']]",
    tasksMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'Tasks']]",
    allMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'All']]",
    typeFilter: "//div[contains(@id,'TypeFilter')]",
    assignedSelectedOption: "//div[contains(@class,'selected-options')]"
};

class IssuesListDialog extends Page {

    get title() {
        return xpath.container + `//h2[@class='title']`;
    }

    get typeFilterDropDownHandle() {
        return xpath.container + xpath.typeFilter + lib.DROP_DOWN_HANDLE;
    }


    get closedButton() {
        return xpath.container + xpath.closedButton;
    }

    get openButton() {
        return xpath.container + xpath.openButton;
    }

    get hideClosedIssuesButton() {
        return xpath.container + xpath.hideClosedIssuesButton;
    }

    get newTaskButton() {
        return xpath.container + xpath.newTaskButton;
    }

    get cancelTopButton() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(xpath.typeFilter, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot("err_load_tasks_list_dlg");
            throw new Error("Issues list dialog is not loaded in " + appConst.TIMEOUT_3)
        })
    }

    isTypeFilterSelectorDisplayed() {
        return this.isElementDisplayed(xpath.typeFilter + "//button");
    }

    async waitForDialogClosed() {
        await this.waitForElementNotDisplayed(xpath.container, appConst.TIMEOUT_2);
        return await this.pause(200);
    }

    isDialogPresent() {
        return this.isElementDisplayed(xpath.container);
    }

    async clickOnCancelTopButton() {
        await this.clickOnElement(this.cancelTopButton);
        return await this.pause(500);
    }

    clickOnNewTaskButton() {
        return this.clickOnElement(this.newTaskButton).catch(err => {
            this.saveScreenshot('err_click_issue_list_new');
            throw  new Error('Isses List Dialog - Error when click on the `New task`  ' + err);
        })
    }

    getTitle() {
        return this.getText(this.title);
    }

    isNewTaskButtonDisplayed() {
        return this.isElementDisplayed(this.newTaskButton);
    }

    isClosedButtonDisplayed() {
        return this.isElementDisplayed(this.closedButton);
    }

    async waitForClosedButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.closedButton, appConst.TIMEOUT_2);
        } catch (err) {
            this.saveScreenshot("err_closed_button_should_be_disabled");
            throw new Error("Issues List Dialog-  Closed button should be disabled " + err);
        }
    }

    async waitForOpenButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.openButton, appConst.TIMEOUT_2);
        } catch (err) {
            this.saveScreenshot("err_open_button_should_be_disabled");
            throw new Error("Issues List Dialog-  'Open' button should be disabled " + err);
        }
    }

    async waitForOpenButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.openButton, appConst.TIMEOUT_2);
        } catch (err) {
            this.saveScreenshot("err_open_button_should_be_displayed");
            throw new Error("Issues List Dialog-  'Open' button should be displayed " + err);
        }
    }

    async clickOnClosedButton() {
        try {
            let el = await this.getDisplayedElements(this.closedButton);
            await el[0].waitForEnabled(appConst.TIMEOUT_2);
            //await this.waitForElementEnabled(this.showClosedIssuesButton,appConst.TIMEOUT_2);
            await this.clickOnElement(this.closedButton);
            return await this.pause(400);
        } catch (err) {
            this.saveScreenshot("err_show_closed_issues_list");
            throw new Error("Issues List dialog - Error when clicking on 'Closed' button  " + err);
        }
    }

    async clickOnOpenButton() {
        try {
            let el = await this.getDisplayedElements(this.openButton);
            await el[0].waitForEnabled(appConst.TIMEOUT_2);
            //await this.waitForElementEnabled(this.showClosedIssuesButton,appConst.TIMEOUT_2);
            await this.clickOnElement(this.openButton);
            return await this.pause(400);
        } catch (err) {
            this.saveScreenshot("err_click_open_button");
            throw new Error("Issues List dialog - Error when clicking on 'Open' button  " + err);
        }
    }

    //clicks on dropdown handle and selects option in the Type Filter
    async selectTypeFilterOption(option) {
        await this.clickOnElement(this.typeFilterDropDownHandle);
        let optionXpath = xpath.typeFilterOption(option);
        await this.waitForElementDisplayed(optionXpath, appConst.TIMEOUT_2);
        await this.clickOnElement(optionXpath);
    }

    getTypeFilterSelectedOption() {
        let selector = xpath.container + xpath.typeFilter + "//button/span"
        return this.getText(selector);
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

    //Scrolls the modal dialog and clicks on the issue:
    clickOnIssue(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        return this.isElementDisplayed(issueXpath).then(result => {
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

    async isOpenButtonActive() {
        await this.waitForOpenButtonDisplayed();
        let result = await this.getAttribute(this.openButton, 'class');
        return result.includes('active');
    }
    async isClosedButtonActive(){
        await this.waitForOpenButtonDisplayed();
        let result = await this.getAttribute(this.closedButton, 'class');
        return result.includes('active');
    }
};
module.exports = IssuesListDialog;
