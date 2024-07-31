const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'IssueListDialog')]`,
    closedButton: "//button[contains(@id,'StatusFilterButton') and child::span[contains(.,'Closed')]]",
    openButton: "//button[contains(@id,'StatusFilterButton') and child::span[contains(.,'Open')]]",
    hideClosedIssuesButton: "//button[contains(@id,'OnOffButton') and child::span[contains(.,'Hide closed issues')]]",
    issueByName: function (name) {
        return `//li[contains(@id,'IssueListItem')]//h6[contains(@class,'main-name') and contains(.,'${name}')]`
    },
    typeFilterOption: option => {
        return `//div[contains(@id,'TypeFilter')]//li[contains(@id,'MenuItem') and contains(.,'${option}')]`
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

    get newIssueButton() {
        return xpath.container + lib.dialogButton('New Issue');
    }

    get cancelTopButton() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_load_tasks_list_dlg");
            throw new Error("Issues list dialog is not loaded in " + appConst.mediumTimeout)
        })
    }

    isTypeFilterSelectorDisplayed() {
        return this.isElementDisplayed(xpath.typeFilter + "//button");
    }

    async waitForDialogClosed() {
        await this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
        return await this.pause(200);
    }

    isDialogPresent() {
        return this.isElementDisplayed(xpath.container);
    }

    async clickOnCancelTopButton() {
        await this.clickOnElement(this.cancelTopButton);
        return await this.pause(500);
    }

    async clickOnNewIssueButton() {
        try {
            await this.waitForNewIssueButtonDisplayed();
            await this.clickOnElement(this.newIssueButton);
        } catch (err) {
            await this.saveScreenshot('err_click_issue_list_new');
            throw new Error('Issues List Dialog - Error during clicking on the `New issue` button  ' + err);
        }
    }

    getTitle() {
        return this.getText(this.title);
    }

    waitForNewIssueButtonDisplayed() {
        return this.waitForElementDisplayed(this.newIssueButton, appConst.mediumTimeout);
    }

    isClosedButtonDisplayed() {
        return this.isElementDisplayed(this.closedButton);
    }

    async waitForClosedButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.closedButton, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName("err_closed_button_should_be_disabled");
            throw new Error(`Issues List Dialog-  Closed button should be disabled , screenshot: ${screenshot} ` + err);
        }
    }

    async waitForOpenButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.openButton, appConst.shortTimeout);
        } catch (err) {
            await this.saveScreenshot("err_open_button_should_be_disabled");
            throw new Error("Issues List Dialog-  'Open' button should be disabled " + err);
        }
    }

    async waitForOpenButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.openButton, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshot("err_open_button_should_be_displayed");
            throw new Error(`Issues List Dialog-  'Open' button should be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnClosedButton() {
        try {
            let el = await this.getDisplayedElements(this.closedButton);
            await el[0].waitForEnabled({timeout: appConst.shortTimeout});
            //await this.waitForElementEnabled(this.showClosedIssuesButton,appConst.shortTimeout);
            await this.clickOnElement(this.closedButton);
            return await this.pause(700);
        } catch (err) {
            await this.saveScreenshot("err_show_closed_issues_list");
            throw new Error("Issues List dialog - Error when clicking on 'Closed' button  " + err);
        }
    }

    async clickOnOpenButton() {
        try {
            let el = await this.getDisplayedElements(this.openButton);
            await el[0].waitForEnabled({timeout: appConst.shortTimeout});
            //await this.waitForElementEnabled(this.showClosedIssuesButton,appConst.shortTimeout);
            await this.clickOnElement(this.openButton);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshot("err_click_open_button");
            throw new Error(`Issues List dialog - Error when clicking on 'Open' button, screenshot: ${screenshot}  ` + err);
        }
    }

    //clicks on dropdown handle and selects option in the Type Filter
    async selectTypeFilterOption(option) {
        try {
            await this.waitForElementEnabled(this.typeFilterDropDownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.typeFilterDropDownHandle);
            let optionXpath = xpath.typeFilterOption(option);
            await this.waitForElementDisplayed(optionXpath, appConst.shortTimeout);
            await this.clickOnElement(optionXpath);
            return this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("issue_list"));
            throw new Error("Issue list dialog  " + err);
        }
    }

    async isTypeFilterOptionDisabled(option) {
        await this.clickOnElement(this.typeFilterDropDownHandle);
        let optionXpath = xpath.typeFilterOption(option);
        return await this.waitForElementDisabled(optionXpath, appConst.shortTimeout);
    }

    async clickOnTypeFilterDropDownHandle() {
        await this.waitForElementDisplayed(this.typeFilterDropDownHandle, appConst.shortTimeout);
        await this.clickOnElement(this.typeFilterDropDownHandle);
        return await this.pause(200);
    }

    getTypeFilterSelectedOption() {
        let selector = xpath.container + xpath.typeFilter + "//button/span";
        return this.getText(selector);
    }

    async getTypeFilterOptions() {
        let selector = xpath.container + xpath.typeFilter + "//li[contains(@id,'MenuItem')]";
        await this.clickOnTypeFilterDropDownHandle();
        let result = await this.getTextInElements(selector);
        return [].concat(result);

    }

    //Wait for state(Disable or Enabled) of the option in the Type Filter:
    async waitForFilterOptionDisabled(option) {
        try {
            let optionXpath = xpath.typeFilterOption(option);
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getAttribute(optionXpath, "class");
                return text.includes('disabled');
            }, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshot("err_type_filter1");
            throw new Error(`Type Filter - menu item:` + option + ` should be disabled! screenshot: ${screenshot} ` + err);
        }
    }

    async isFilterOptionDisabled(option) {
        let optionXpath = xpath.typeFilterOption(option);
        let attr = await this.getAttribute(optionXpath, "class");
        return attr.includes('disabled');
    }

    isIssuePresent(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        return this.waitForElementDisplayed(issueXpath, appConst.shortTimeout).catch(err => {
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

    async waitForIssueNotPresent(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        return await this.waitForElementNotDisplayed(issueXpath, appConst.shortTimeout);
    }

    async waitForIssuePresent(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        return await this.waitForElementDisplayed(issueXpath, appConst.shortTimeout);
    }

    async isOpenButtonActive() {
        await this.waitForOpenButtonDisplayed();
        let result = await this.getAttribute(this.openButton, 'class');
        return result.includes('active');
    }

    async isClosedButtonActive() {
        await this.waitForOpenButtonDisplayed();
        let result = await this.getAttribute(this.closedButton, 'class');
        return result.includes('active');
    }

    async getNumberInClosedButton() {
        try {
            let buttonText = await this.getText(this.closedButton);
            let startIndex = buttonText.indexOf('(');
            if (startIndex === -1) {
                return '0'
            }
            let endIndex = buttonText.indexOf(')');
            if (endIndex === -1) {
                throw new Error("Issue List Dialog, Closed button - incorrect text in the label, ')' was not found");
            }
            return buttonText.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error("Issue List Dialog : error when getting the number in Closed button: " + err);
        }
    }

    async getNumberInOpenButton() {
        try {
            let buttonText = await this.getText(this.openButton);
            let startIndex = buttonText.indexOf('(');
            if (startIndex === -1) {
                return '0';
            }
            let endIndex = buttonText.indexOf(')');
            if (endIndex === -1) {
                throw new Error("Issue List Dialog, Open button - incorrect text in the label, '}' was not found");
            }
            return buttonText.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error("Issue List Dialog : error when getting the number in Open button: " + err);
        }
    }

    async getNumberInSelectedOption() {
        try {
            let selector = xpath.container + xpath.typeFilter + "//button/span";
            let textInSelectedOption = await this.getText(selector);
            let startIndex = textInSelectedOption.indexOf('(');
            if (startIndex === -1) {
                throw new Error("Issue List Dialog, Selected option - incorrect text in the label, '(' was not found");
            }
            let endIndex = textInSelectedOption.indexOf(')');
            if (endIndex === -1) {
                throw new Error("Issue List Dialog, Selected option - incorrect text in the label, '}' was not found");
            }
            return textInSelectedOption.substring(startIndex + 1, endIndex);
        } catch (err) {
            throw new Error("Issue List Dialog : error when getting the number in Selected option: " + err);
        }
    }
}

module.exports = IssuesListDialog;
