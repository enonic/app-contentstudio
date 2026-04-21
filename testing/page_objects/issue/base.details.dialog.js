const Page = require('../page');
const {BUTTONS, DROPDOWN, ISSUE} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='IssueDialogDetailsContent' and @role='dialog']`,
    titleInput: "//div[@data-component='EditableText']//input[@aria-label='Title']",
    toIssueList: "//a[@title='To the Issue List']",
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    editIssueTitleToggle: `//h2[@class='inplace-text' and @title='Click to  edit']`,
    reopenIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Issue']]`,
    reopenRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Request']]`,
    itemsTabBarItem: "//button[@role='tab') and child::span[contains(.,'Items')]]",
    assigneesTabItem: "//button[@role='tab') and child::span[contains(.,'Assignees')]]",
    commentsTabItem: "//button[@role='tab') and child::span[contains(.,'Comments')]]",
    issueStatusSelectorButton: `//button[@role='combobox' and descendant::span[@data-component='IssueStatusBadge']]`,
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    issueCommentsListItem: `//div[contains(@id,'IssueCommentsListItem')]`,
    noActionLabel: `//div[@class='no-action-message']`,
    tabByLabel: label => `//button[contains(@role,'tab') and child::span[contains(.,'${label}')]]`,
};

class BaseIssueDetailsDialog extends Page {

    get backButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Back to issues');
    }

    get titleInput() {
        return XPATH.container + XPATH.titleInput;
    }

    get issueTitleInputToggle() {
        return XPATH.issueNameInPlaceInput + XPATH.editIssueTitleToggle;
    }

    get issueStatusSelector() {
        return XPATH.container + XPATH.issueStatusSelectorButton;
    }

    get issueCommentTextArea() {
        return XPATH.container + XPATH.issueCommentTextArea + lib.TEXT_AREA;
    }

    get commentsTabItem() {
        return XPATH.container + XPATH.commentsTabItem;
    }

    get assigneesTabBarItem() {
        return XPATH.container + XPATH.assigneesTabItem;
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    isNoActionLabelPresent() {
        return this.isElementDisplayed(XPATH.noActionLabel);
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton);
            await this.clickOnElement(this.closeButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Issue Details Dialog, click on Close button', 'err_click_close_btn', err);
        }
    }

    // Click on "To Issues list"
    async clickOnBackToIssuesButton() {
        try {
            await this.waitForElementDisplayed(this.backButton);
            return this.clickOnElement(this.backButton);
        } catch (err) {
            await this.handleError('Issue Details Dialog, tried to click on Back to Issues button', 'err_click_back_to_issues_btn', err);
        }
    }

    async waitForBackToIssuesButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.backButton);
        } catch (err) {
            await this.handleError('Issue Details Dialog, Back to Issues button not displayed', 'err_back_to_issues_btn', err);
        }
    }

    async clickOnTitleInput() {
        await this.clickOnElement(this.titleInput);
        return await this.pause(500);
    }

    async typeTitle(title) {
        try {
            await this.typeTextInInput(this.titleInput, title);
            await this.pause(400);
        } catch (err) {
            await this.saveScreenshot('err_type_issue_title');
            throw new Error('error when type the issue-title ' + err);
        }
    }

    async updateTitle(newTitle) {
        try {
            await this.clearInputText(this.titleInput);
            await this.addTextInInput(this.titleInput, newTitle);
            await this.pause(400);
            await this.clickOnElement(XPATH.container);
        } catch (err) {
            await this.handleError('Issue Details Dialog, tried to update the issue title', 'err_update_issue_title', err);
        }
    }

    async waitForIssueTitleInputNotEditable() {
        let locator = XPATH.container + "//div[@data-component='EditableText']//input[@aria-label='Title']";
        await this.waitForElementDisabled(locator);
    }

    async clickOnStatusSelectorMenu() {
        let statusSelectorButton = this.issueStatusSelector;
        await this.waitForElementDisplayed(statusSelectorButton);
        await this.clickOnElement(statusSelectorButton);
        return await this.pause(100);
    }

    async clickOnIssueStatusSelectorAndCloseIssue() {
        try {
            // expand the dropdown selector menu:
            await this.clickOnStatusSelectorMenu();
            let optionItemLocator = DROPDOWN.listboxOptionByText(appConst.ISSUES.STATUS_CLOSED);
            // click on the 'Closed' option item:
            await this.waitForElementDisplayed(optionItemLocator);
            await this.clickOnElement(optionItemLocator);
            return await this.waitForNotificationMessage();
        } catch (err) {
            await this.handleError('Issue Details Dialog, tried to click on "Closed" option', 'err_issue_status_selector', err);
        }
    }

    async clickOnIssueStatusSelectorAndOpenIssue() {
        let optionItemLocator = DROPDOWN.listboxOptionByText(appConst.ISSUES.STATUS_OPEN);
        // expand the menu:
        await this.clickOnStatusSelectorMenu();
        // click on the menu item:
        await this.waitForElementDisplayed(optionItemLocator);
        await this.clickOnElement(optionItemLocator);
        return await this.waitForNotificationMessage();
    }

    pressEscKey() {
        return this.getBrowser().keys(['Escape']);
    }

    async getIssueTitle() {
        let result = await this.getText(XPATH.issueNameInPlaceInput + '/h2');
        let endIndex = result.indexOf('#');
        return result.substring(0, endIndex).trim();
    }

    async isTabActive(tabName) {
        try {
            let tabLocator = XPATH.tabByLabel(tabName);
            await this.waitForElementDisplayed(tabLocator);
            let value = await this.getAttribute(tabLocator, 'data-state');
            return value === 'active';
        } catch (err) {
            await this.handleError(`Issue Details Dialog, is ${tabName} tab active`, 'err_is_tab_active', err);
        }
    }

    async clickOnCommentsTabItem() {
        await this.clickOnElement(this.commentsTabItem);
        return await this.pause(200);
    }

    async clickOnAssigneesTabBarItem() {
        await this.clickOnElement(this.assigneesTabBarItem);
        return await this.pause(800);
    }

    async getCurrentStatusInStatusSelector() {
        try {
            let locator = this.issueStatusSelector + "//span[2]";
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Issue Details Dialog, tried to get the current status in status selector', 'err_get_current_status',
                err);
        }
    }

    async clickOnIncludeChildrenCheckbox(displayName) {
        try {
            let includeIcon = ISSUE.contentRowByName(displayName) + "/following-sibling::div[contains(@id,'children')]//label";
            await this.waitForElementDisplayed(includeIcon, appConst.shortTimeout);
            await this.clickOnElement(includeIcon);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Tried to click on 'include children' checkbox for the content: ${displayName}`, 'err_include_children',
                err);
        }
    }
}

module.exports = BaseIssueDetailsDialog;
