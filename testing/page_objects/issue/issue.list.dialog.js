const Page = require('../page');
const {BUTTONS, NEW_DROPDOWN} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: `//div[@role='dialog' and contains(@data-component,'IssueDialogListContent')]`,
    closedTabButton: "//button[@role='tab' and child::span[contains(.,'Closed')]]",
    openTabButton: "//button[@role='tab' and child::span[contains(.,'Open')]]",
    issueItemByName(name) {
        return `//div[@data-component='IssueList']//div[@data-component='IssueListItem' and descendant::div[contains(.,'${name}')]]`
    },
    typeFilterOption: option => {
        return `//div[contains(@id,'TypeFilter')]//li[contains(@id,'MenuItem') and contains(.,'${option}')]`
    },
    publishRequestsMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'Publish requests']]",
    createdByMeMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'Created by Me']]",
    assignedToMeMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'Assigned to Me']]",
    allMenuItem: "//li[contains(@id,'MenuItem')and contains(.,'All']]",
    typeFilterSelectedOption: "//button[@role='combobox' and contains(@id,'trigger')]//span[1]",
    assignedSelectedOption: "//div[contains(@class,'selected-options')]"
};

class IssuesListDialog extends Page {

    get title() {
        return xpath.container + `//h2[@class='title']`;
    }

    get typeFilterDropDownHandle() {
        return xpath.container + NEW_DROPDOWN.buttonComboboxByLabel('Filter');
    }

    get closedTabButton() {
        return xpath.container + xpath.closedTabButton;
    }

    get openTabButton() {
        return xpath.container + xpath.openTabButton;
    }

    get newIssueButton() {
        return xpath.container + BUTTONS.buttonByLabel('New Issue');
    }

    get closeButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Close');
    }
    async getSelectedOptionInFilterDropdown(){
        await this.waitForElementDisplayed(this.typeFilterDropDownHandle, appConst.shortTimeout);
        let selector = this.typeFilterDropDownHandle + "/span[1]";
        return await this.getText(selector);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
            await this.pause(200);
        } catch (err) {
            await this.handleError('Issues list dialog was not loaded', 'err_load_issue_list_dialog', err);
        }
    }

    isTypeFilterSelectorDisplayed() {
        return this.isElementDisplayed(xpath.typeFilter + "//button");
    }

    async waitForDialogClosed() {
        await this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
        return await this.pause(200);
    }

    async clickOnCloseButton() {
        await this.clickOnElement(this.closeButton);
        return await this.pause(200);
    }

    async clickOnNewIssueButton() {
        try {
            await this.waitForNewIssueButtonDisplayed();
            await this.clickOnElement(this.newIssueButton);
        } catch (err) {
            await this.handleError('Issues List Dialog - tried to click on `New issue` button ', 'err_click_issue_list_new', err);
        }
    }

    getTitle() {
        return this.getText(this.title);
    }

    waitForNewIssueButtonDisplayed() {
        return this.waitForElementDisplayed(this.newIssueButton, appConst.mediumTimeout);
    }

    async waitForClosedTabButtonDisplayed() {
        return await this.waitForElementDisplayed(this.closedTabButton, appConst.mediumTimeout);
    }

    async waitForClosedTaButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.closedTabButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError("Issues List Dialog,  'Closed' tab button should be disabled", 'err_closed_tab', err);
        }
    }

    async waitForOpenTabButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.openTabButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError("Issues List Dialog,  'Open' tab button should be disabled", 'err_open_tab_button', err);
        }
    }

    async waitForOpenTabButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.openTabButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError("Issues List Dialog,  'Open' tab button should be disabled", 'err_open_tab_button', err);
        }
    }

    async clickOnClosedTabButton() {
        try {
            let el = await this.getDisplayedElements(this.closedTabButton);
            await el[0].waitForEnabled({timeout: appConst.shortTimeout});
            await this.clickOnElement(this.closedTabButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Issues List Dialog - error when clicking on 'Closed' button`, 'err_click_closed_button', err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_click_open_button');
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
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_list');
            throw new Error(`Error occurred in Issue list dialog , screenshot: ${screenshot} ` + err);
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

    async getSelectedOptionInTypeFilter() {
        try {
            let locator = xpath.container + xpath.typeFilterSelectedOption;
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`Issue List Dialog - error when getting the selected option in Type Filter `, 'err_type_filter', err);
        }
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
                let text = await this.getAttribute(optionXpath, 'class');
                return text.includes('disabled');
            }, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_type_filter1');
            throw new Error(`Type Filter - menu item:` + option + ` should be disabled! screenshot: ${screenshot} ` + err);
        }
    }

    async isFilterOptionDisabled(option) {
        let optionXpath = xpath.typeFilterOption(option);
        let attr = await this.getAttribute(optionXpath, 'class');
        return attr.includes('disabled');
    }

    isIssuePresent(issueName) {
        let issueXpath = xpath.issueByName(issueName);
        return this.waitForElementDisplayed(issueXpath, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("issue_not_present_" + issueName);
            return false;
        })
    }

    async scrollToIssue(issueName) {
        let issueXpath = xpath.issueItemByName(issueName);
        //TODO implement it.
        //return this.element(issueXpath).then(elem => {
        //     return elem.scroll();
        //})
    }

    // Scrolls the modal dialog and clicks on the issue:
    async clickOnIssue(issueName) {
        try {
            let issueXpath = xpath.issueItemByName(issueName);
            let result = await this.isElementDisplayed(issueXpath);
            if (!result) {
                await this.scrollToIssue(issueXpath);
            }
            return await this.clickOnElement(issueXpath);
        } catch (err) {
            await this.handleError(`Issue List Dialog - error when clicking on issue: ${issueName}`, 'err_click_on_issue', err);
        }
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
        await this.waitForOpenTabButtonDisplayed();
        let result = await this.getAttribute(this.openButton, 'class');
        return result.includes('active');
    }

    async isClosedButtonActive() {
        await this.waitForClosedTabButtonDisplayed();
        let result = await this.getAttribute(this.closedTabButton, 'class');
        return result.includes('active');
    }

    async getNumberInClosedButton() {
        try {
            let locator = this.closedTabButton + "/span[2]";
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            let closedIssuesNumber = await this.getText(locator);
            return closedIssuesNumber;
        } catch (err) {
            await this.handleError(`Issue List Dialog : error when getting the number of issues in 'Closed' tab button`,
                'err_closed_issues_number', err);
        }
    }

    async getNumberInOpenButton() {
        try {
            let locator = this.openTabButton + "/span[2]";
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            let openIssuesNumber = await this.getText(locator);
            return openIssuesNumber;
        } catch (err) {
            await this.handleError(`Issue List Dialog : error when getting the number of issues in 'Open' tab button`,
                'err_open_issues_number', err);
        }
    }

    async getNumberItemsInFilterCombobox() {
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
            let screenshot = await this.saveScreenshotUniqueName('err_issue_list');
            throw new Error(`Issue List Dialog : error when getting the number in Selected option, screenshot:${screenshot} ` + err);
        }
    }
}

module.exports = IssuesListDialog;
