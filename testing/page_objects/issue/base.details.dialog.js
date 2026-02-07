const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='IssueDialogDetailsContent' and @role='dialog']`,
    toIssueList: "//a[@title='To the Issue List']",
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    editIssueTitleToggle: `//h2[@class='inplace-text' and @title='Click to  edit']`,
    reopenIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Issue']]`,
    reopenRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Request']]`,
    itemsTabBarItem: "//button[@role='tab') and child::span[contains(.,'Items')]]",
    assigneesTabItem: "//button[@role='tab') and child::span[contains(.,'Assignees')]]",
    commentsTabItem: "//button[@role='tab') and child::span[contains(.,'Comments')]]",
    issueStatusSelectorButton: `//button[@role='combobox' and contains(@id,'trigger')]`,
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    issueCommentsListItem: `//div[contains(@id,'IssueCommentsListItem')]`,
    noActionLabel: `//div[@class='no-action-message']`,
    tabByLabel: label => `//button[contains(@role,'tab') and child::span[contains(.,'${label}')]]`,
    issueStatusMenuItem:
        menuItem => `//ul[contains(@class,'menu')]/li[contains(@id,'TabMenuItem') and child::a[text()='${menuItem}']]`,
};

class BaseIssueDetailsDialog extends Page {

    get backButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Back to issues');
    }

    get titleInput() {
        return XPATH.container + XPATH.issueNameInPlaceInput + '//input';
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
        return XPATH.container + BUTTONS.buttonByLabel('Close');
    }

    isNoActionLabelPresent() {
        return this.isElementDisplayed(XPATH.noActionLabel);
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton, appConst.mediumTimeout);
            await this.clickOnElement(this.closeButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Issue Details Dialog, click on Close button', 'err_click_close_btn', err);
        }
    }

    // Click on "To Issues list"
    async clickOnBackToIssuesButton() {
        try {
            await this.waitForElementDisplayed(this.backButton, appConst.mediumTimeout);
            return this.clickOnElement(this.backButton);
        } catch (err) {
            await this.handleError('Issue Details Dialog, tried to click on Back to Issues button', 'err_click_back_to_issues_btn', err);
        }
    }

    async clickOnEditTitle() {
        await this.clickOnElement(this.issueTitleInputToggle);
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
            await this.addTextInInput(this.titleInput, newTitle);
            await this.pause(400);
        } catch (err) {
            await this.saveScreenshot('err_type_issue_title');
            throw new Error('error during update the issue-title ' + err);
        }
    }

    waitForIssueTitleInputNotEditable() {
        return this.getBrowser().waitUntil(() => {
            return this.isElementDisplayed(`//div[contains(@id,'IssueDetailsInPlaceTextInput') and contains (@class,'disabled')]`);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Issue details dialog - title should not be editable!"});
    }

    async clickOnStatusSelectorMenu() {
        let statusSelectorButton = this.issueStatusSelector;
        await this.waitForElementDisplayed(statusSelectorButton, appConst.mediumTimeout);
        await this.clickOnElement(statusSelectorButton);
        return await this.pause(100);
    }

    async clickOnIssueStatusSelectorAndCloseIssue() {
        try {
            // expand the menu:
            await this.clickOnStatusSelectorMenu();
            let menuItemSelector = XPATH.issueStatusMenuItem('Closed');
            // click on the menu item:
            await this.waitForElementDisplayed(menuItemSelector, appConst.mediumTimeout);
            await this.clickOnElement(menuItemSelector);
            return await this.waitForNotificationMessage();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_status_selector');
            throw new Error(`Error occurred in IssueDetails, status selector menu , screenshot:${screenshot} ` + err);
        }
    }

    async clickOnIssueStatusSelectorAndOpenIssue() {
        let menuItemSelector = XPATH.issueStatusMenuItem('Open');
        // expand the menu:
        await this.clickOnStatusSelectorMenu();
        // click on the menu item:
        await this.waitForElementDisplayed(menuItemSelector, appConst.mediumTimeout);
        await this.clickOnElement(menuItemSelector);
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
            await this.waitForElementDisplayed(tabLocator, appConst.shortTimeout);
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
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        }catch (err){
            await this.handleError('Issue Details Dialog, get current status in status selector', 'err_get_current_status_in_status_selector', err);
        }
    }
}

module.exports = BaseIssueDetailsDialog;
