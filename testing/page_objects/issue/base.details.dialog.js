const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    toIssueList: "//a[@title='To the Issue List']",
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    editIssueTitleToggle: `//h2[@class='inplace-text' and @title='Click to  edit']`,
    reopenIssueButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Issue']]`,
    reopenRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Request']]`,
    commentButton: `//button[contains(@id,'DialogButton') and child::span[text()='Comment']]`,
    itemsTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Items')]]",
    assigneesTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Assignees')]]",
    commentsTabBarItem: "//li[contains(@id,'TabBarItem') and child::a[contains(.,'Comments')]]",
    issueStatusSelector: `//div[contains(@id,'IssueStatusSelector')]`,
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    issueCommentsListItem: `//div[contains(@id,'IssueCommentsListItem')]`,
    noActionLabel: `//div[@class='no-action-message']`,
    issueCommentsListItemByText:
        text => `//div[contains(@id,'IssueCommentsListItem') and descendant::p[@class='inplace-text' and text()='${text}']]`,
    issueStatusMenuItem:
        menuItem => `//ul[contains(@class,'menu')]/li[contains(@id,'TabMenuItem') and child::a[text()='${menuItem}']]`,

};

class BaseDetailsDialog extends Page {

    get backButton() {
        return XPATH.container + XPATH.toIssueList;
    }

    get titleInput() {
        return XPATH.container + XPATH.issueNameInPlaceInput + '//input';
    }

    get issueTitleInputToggle() {
        return XPATH.issueNameInPlaceInput + XPATH.editIssueTitleToggle;
    }

    get issueStatusSelector() {
        return XPATH.container + XPATH.issueStatusSelector;
    }

    get issueCommentTextArea() {
        return XPATH.container + XPATH.issueCommentTextArea + lib.TEXT_AREA;
    }

    get commentsTabBarItem() {
        return XPATH.container + XPATH.commentsTabBarItem;
    }

    get assigneesTabBarItem() {
        return XPATH.container + XPATH.assigneesTabBarItem;
    }

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    isNoActionLabelPresent() {
        return this.isElementDisplayed(XPATH.noActionLabel);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    async clickOnCancelTopButton() {
        try {
            await this.waitForElementDisplayed(this.cancelTopButton, appConst.mediumTimeout);
            await this.pause(500);
            await this.clickOnElement(this.cancelTopButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_cancel_top');
            await this.saveScreenshot(screenshot);
            throw new Error('Error after clicking on Cancel Top button, screenshot:  ' + screenshot + ' ' + err);
        }
    }

    clickOnIssueStatusSelector() {
        return this.clickOnElement(this.issueStatusSelector);
    }

    // Click on "To Issues list"
    async clickOnBackButton() {
        try {
            await this.waitForElementDisplayed(this.backButton, appConst.mediumTimeout);
            return this.clickOnElement(this.backButton);
        } catch (err) {
            throw new Error("Issue Details Dialog-  button back(To issues list) is not present!" + err);
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
            this.saveScreenshot('err_type_issue_title');
            throw new Error('error during update the issue-title ' + err);
        }
    }

    waitForIssueTitleInputNotEditable() {
        return this.getBrowser().waitUntil(() => {
            return this.isElementDisplayed(`//div[contains(@id,'IssueDetailsInPlaceTextInput') and contains (@class,'disabled')]`);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Issue details dialog - title should not be editable!"});
    }

    async clickOnIssueStatusSelectorAndCloseIssue() {
        let menuItemSelector = XPATH.issueStatusMenuItem('Closed');
        await this.clickOnElement(this.issueStatusSelector);
        await this.waitForElementDisplayed(menuItemSelector, appConst.mediumTimeout);
        await this.clickOnElement(menuItemSelector);
        return await this.waitForNotificationMessage();
    }

    async clickOnIssueStatusSelectorAndOpenIssue() {
        let menuItemSelector = XPATH.issueStatusMenuItem('Open');
        await this.clickOnElement(this.issueStatusSelector);
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

    isCommentsTabBarItemActive() {
        return this.getAttribute(this.commentsTabBarItem, 'class').then(result => {
            return result.includes('active');
        }).catch(err => {
            throw  new Error('Issue Details Dialog  ' + err);
        })
    }

    async clickOnCommentsTabBarItem() {
        await this.clickOnElement(this.commentsTabBarItem);
        return await this.pause(400);
    }

    async clickOnAssigneesTabBarItem() {
        await this.clickOnElement(this.assigneesTabBarItem);
        return await this.pause(800);
    }

    getCurrentStatusInStatusSelector() {
        let locator = this.issueStatusSelector + "//div[contains(@id,'TabMenuButton')]/a";
        return this.getText(locator);
    }
}

module.exports = BaseDetailsDialog;
