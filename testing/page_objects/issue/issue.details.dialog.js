const BaseDetailsDialog = require('./base.details.dialog');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[@role='dialog' and contains(@data-component,'IssueDialogDetailsContent')]`,
    issueNameInPlaceInput: `//div[contains(@id,'IssueDetailsInPlaceTextInput')]`,
    editIssueTitleToggle: `//h2[@class='inplace-text' and @title='Click to  edit']`,
    itemsTabItem: "//button[contains(@role,'tab') and child::span[contains(.,'Items')]]",
    commentsTabItem: "//button[contains(@role,'tab') and child::span[contains(.,'Comments')]]",
    assigneesTabItem: "//button[contains(@role,'tab') and child::span[contains(.,'Assignees')]]",
    issueCommentTextArea: `//div[contains(@id,'IssueCommentTextArea')]`,
    issueCommentsListItem: `//div[contains(@id,'IssueCommentsListItem')]`,
    noActionLabel: `//div[@class='no-action-message']`,
    closedMenuOption: "//span[@data-component='IssueStatusBadge' and child::span[text()='Closed']]",
    openMenuOption: "//span[@data-component='IssueStatusBadge' and child::span[text()='Open']]",
};

class IssueDetailsDialog extends BaseDetailsDialog {

    get itemsTabItem() {
        return XPATH.container + XPATH.itemsTabItem;
    }

    get commentsTabItem() {
        return XPATH.container + XPATH.commentsTabItem;
    }

    get assigneesTabItem() {
        return XPATH.container + XPATH.assigneesTabItem;
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Issue Details dialog was not loaded', 'err_load_issue_details_dialog', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError('Issue Details Dialog was not closed', 'err_wait_close_issue_det_dialog', err);
        }
    }

    async getNumberInItemsTab() {
        try {
            let xpath = this.itemsTabItem + '/span[2]';
            let result = await this.getText(xpath);
            return result;
        } catch (err) {
            await this.handleError('Issue Details Dialog, tried to get the number in Items tab', 'err_get_number_in_items_tab', err);
        }
    }

    async waitForNumberInItemsTab(value) {
        try {
            let xpath = this.itemsTabItem + '/span[2]';
            await this.getBrowser().waitUntil(async () => {
                let result = await this.getText(xpath);
                let resultNum = parseInt(result, 10);
                return resultNum === Number(value);
            }, {timeout: appConst.mediumTimeout, timeoutMsg: "'Items' tab number is not equal to " + value});
        } catch (err) {
            await this.handleError('Issue Details Dialog, tried to get the number in Items tab', 'err_get_number_in_items_tab', err);
        }
    }


    async getIssueTitle() {
        return await this.getTextInInput(this.titleInput);
    }

    async isItemsTabItemActive() {
        try {
            let result = await this.getAttribute(this.itemsTabItem, 'class');
            return result.includes('active');
        } catch (err) {
            throw new Error('Issue Details Dialog  ' + err);
        }
    }

    // Clicks on 'Items' tab item in Issue Details dialog
    async clickOnItemsTabItem() {
        try {
            await this.waitForElementDisplayed(this.itemsTabItem, appConst.mediumTimeout);
            await this.clickOnElement(this.itemsTabItem);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Issue Details Dialog: error during clicking on 'Items' tab`, 'err_issues_click_on_items_tab', err);
        }
    }

    async clickOncloseMenuOptionItem() {
        try {
            await this.waitForElementDisplayed(XPATH.closedMenuOption, appConst.mediumTimeout);
            await this.pause(200);
            await this.clickOnElement(XPATH.closedMenuOption);
        } catch (err) {
            await this.handleError('Issue Details Dialog: error during clicking on Close Issue menu item',
                'err_click_close_issue_menu_item', err);
        }
    }

    // gets text in title attribute:
    async getIssueStatusInfo() {
        await this.waitForElementDisplayed(this.issueStatusSelector, appConst.mediumTimeout);
        let titleAttr = await this.getAttribute(this.issueStatusSelector, 'title');
        return titleAttr;
    }
}

module.exports = IssueDetailsDialog;
