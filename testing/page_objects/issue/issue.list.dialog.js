const Page = require('../page');
const {BUTTONS, DROPDOWN} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: `//div[@role='dialog' and contains(@data-component,'IssueDialogListContent')]`,
    closedTabButton: "//button[@role='tab' and child::span[contains(.,'Closed')]]",
    openTabButton: "//button[@role='tab' and child::span[contains(.,'Open')]]",
    issueItemByName(name) {
        return `//div[@data-component='IssueList']//div[@data-component='IssueListItem' and descendant::div[contains(.,'${name}')]]`
    },
    // portal-rendered options live outside the dialog container; match by ItemText (count suffix included)
    typeFilterOption: option => {
        return `//div[@data-component='Selector.Content' and @data-state='open']` +
               `//div[@data-component='Selector.Item' and descendant::span[@data-component='Selector.ItemText' and contains(text(),'${option}')]]`
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
        return xpath.container + `//header//h2`;
    }

    get typeFilterDropDownHandle() {
        return xpath.container + DROPDOWN.SELECTOR_TRIGGER;
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

    async getSelectedOptionInFilterDropdown() {
        await this.waitForElementDisplayed(this.typeFilterDropDownHandle, appConst.shortTimeout);
        let selector = this.typeFilterDropDownHandle + "/span[1]";
        return await this.getText(selector);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(xpath.container);
            await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_list_dlg');
            throw new Error(`Issues list dialog is not loaded screenshot: ${screenshot} ` + err);
        }
    }

    async waitForTypeFilterInputDisplayed() {
        return await this.isElementDisplayed(xpath.typeFilterSelectedOption);
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
            await this.waitForElementEnabled(this.typeFilterDropDownHandle);
            await this.clickOnElement(this.typeFilterDropDownHandle);
            let optionXpath = xpath.typeFilterOption(option);
            await this.waitForElementDisplayed(optionXpath, appConst.shortTimeout);
            await this.clickOnElement(optionXpath);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Issue List Dialog - error when selecting the option: ${option} in Type Filter`,
                'err_select_type_filter_option', err);
        }
    }

    // clicks on the dropdown handle then checks 'aria-disabled' attribute of the option:
    async isTypeFilterOptionDisabled(option) {
        await this.clickOnElement(this.typeFilterDropDownHandle);
        let optionXpath = xpath.typeFilterOption(option);
        await this.waitForElementDisplayed(optionXpath, appConst.shortTimeout);
        let attr = await this.getAttribute(optionXpath, 'aria-disabled');
        return attr === 'true';
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

    // returns the array of options text in the expanded Type Filter, e.g. ['All (2)', 'Assigned to Me', ...]
    async getOptionsFromTypeFilter() {
        try {
            let locator = `//div[@data-component='Selector.Content' and @data-state='open']` +
                          `//div[@data-component='Selector.Item']//span[@data-component='Selector.ItemText']`;
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Issue List Dialog - error when getting options in Type Filter', 'err_type_filter_options', err);
        }
    }

    // Wait for the option in the expanded Type Filter to get disabled state:
    // options are divs, so the state is exposed via 'aria-disabled' attribute, not the 'disabled' property
    async waitForFilterOptionDisabled(option) {
        try {
            let optionXpath = xpath.typeFilterOption(option) + "[@aria-disabled='true']";
            await this.waitForElementDisplayed(optionXpath, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(`Issue List Dialog, the option: ${option} in selector should be disabled`, 'err_item_disabled', err);
        }
    }

    async isFilterOptionDisabled(option) {
        let optionXpath = xpath.typeFilterOption(option);
        let attr = await this.getAttribute(optionXpath, 'aria-disabled');
        return attr === 'true';
    }

    isIssuePresent(issueName) {
        let issueXpath = xpath.issueItemByName(issueName);
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

    async getClosedInfo(issueName) {
        let issueXpath = xpath.issueItemByName(issueName);
        let result = await this.isElementDisplayed(issueXpath);
        if (!result) {
            await this.scrollToIssue(issueXpath);
        }
        let locatorInfo = issueXpath + "//div[contains(.,'Closed by')]";
        await this.waitForElementDisplayed(locatorInfo);
        let text = await this.getText(locatorInfo);
        const closedByMatch = text.match(/Closed by\s+(.+)/);
        return closedByMatch ? closedByMatch[1].trim() : text.trim();
    }

    async waitForIssueNotPresent(issueName) {
        let issueXpath = xpath.issueItemByName(issueName);
        return await this.waitForElementNotDisplayed(issueXpath);
    }

    async waitForIssuePresent(issueName) {
        let issueXpath = xpath.issueItemByName(issueName);
        return await this.waitForElementDisplayed(issueXpath, appConst.shortTimeout);
    }

    async isClosedButtonActive() {
        await this.waitForClosedTabButtonDisplayed();
        let result = await this.getAttribute(this.closedTabButton, 'class');
        return result.includes('active');
    }

    // returns the number in the counter badge of 'Closed' tab button, the badge is not displayed when there are no closed issues:
    async getNumberInClosedButton() {
        try {
            await this.waitForClosedTabButtonDisplayed();
            return await this.getNumberInTabButton(this.closedTabButton);
        } catch (err) {
            await this.handleError(`Issue List Dialog : error when getting the number of issues in 'Closed' tab button`,
                'err_closed_issues_number', err);
        }
    }

    // returns the number in the counter badge of 'Open' tab button, the badge is not displayed when there are no open issues:
    async getNumberInOpenButton() {
        try {
            await this.waitForOpenTabButtonDisplayed();
            return await this.getNumberInTabButton(this.openTabButton);
        } catch (err) {
            await this.handleError(`Issue List Dialog : error when getting the number of issues in 'Open' tab button`,
                'err_open_issues_number', err);
        }
    }

    // returns the number in the second span(counter badge) of the tab button, or 0 if the badge is absent:
    async getNumberInTabButton(buttonLocator) {
        let badgeElements = await this.findElements(buttonLocator + '/span[2]');
        if (badgeElements.length === 0) {
            return 0;
        }
        let text = await badgeElements[0].getText();
        return parseInt(text, 10);
    }

    // returns the number in the label of the selected option in Type Filter, e.g. 22 for 'All (22)', or 0 if the label has no number:
    async getNumberItemsInFilterInput() {
        try {
            let selector = xpath.container + "//span[@data-component='Selector.Value']";
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            let textInSelectedOption = await this.getText(selector);
            let match = textInSelectedOption.match(/\((\d+)\)/);
            return match ? parseInt(match[1], 10) : 0;
        } catch (err) {
            await this.handleError('Issue List Dialog - error when getting the number in the selected option in Type Filter',
                'err_filter_input_number', err);
        }
    }
}

module.exports = IssuesListDialog;
