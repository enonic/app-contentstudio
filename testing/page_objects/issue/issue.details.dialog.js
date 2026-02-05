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
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Issue Details dialog was not loaded', 'err_load_issue_details_dialog', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Issue Details Dialog was not closed', 'err_wait_close_issue_det_dialog', err);
        }
    }

    async getNumberOfItems() {
        let xpath = this.itemsTabBarItem + '/a';
        let result = await this.getText(xpath);
        let startIndex = result.indexOf('(');
        if (startIndex === -1) {
            return undefined;
        }
        let endIndex = result.indexOf(')');
        return result.substring(startIndex + 1, endIndex);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }


    async getIssueTitle() {
        let result = await this.getText(XPATH.issueNameInPlaceInput + '/h2');
        let endIndex = result.indexOf('#');
        return result.substring(0, endIndex).trim();
    }

    async getNumberInItemsTab() {
        let result = await this.getText(this.itemsTabBarItem);
        let startIndex = result.indexOf('(');
        if (startIndex === -1) {
            return undefined;
        }
        let endIndex = result.indexOf(')');
        return result.substring(startIndex + 1, endIndex);
    }

    async isItemsTabBarItemActive() {
        try {
            let result = await this.getAttribute(this.itemsTabBarItem, 'class');
            return result.includes('active');
        } catch (err) {
            throw new Error('Issue Details Dialog  ' + err);
        }
    }

    async clickOnItemsTabBarItem() {
        try {
            await this.waitForElementDisplayed(this.itemsTabBarItem, appConst.mediumTimeout);
            await this.clickOnElement(this.itemsTabBarItem);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_click_on_items_tab_bar_item');
            throw new Error('Issue Details Dialog: error during clicking on Items tab bar item: ' + err)
        }
    }

    async clickOncloseMenuOptionItem() {
        try {
            await this.waitForElementDisplayed(XPATH.closedMenuOption, appConst.mediumTimeout);
            await this.pause(200);
            await this.clickOnElement(XPATH.closedMenuOption);
        }catch (err){
            await this.handleError('Issue Details Dialog: error during clicking on Close Issue menu item', 'err_click_close_issue_menu_item', err);
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
