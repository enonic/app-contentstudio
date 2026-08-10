const Page = require('../page');
const { COMMON } = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const AssigneeSelectorDropdown = require('../components/selectors/assignee.selector.dropdown');

const XPATH = {
    container: `//div[@data-component='IssueDialogDetailsContent' and @role='dialog']`,
    assigneesTabPanel: `//div[@role='tabpanel' and contains(@id,'assignees')]`,
    assigneeSelectorDiv: `//div[@data-component='AssigneeSelector']`,
    selectedAssigneeListItem: `//div[@data-component='ListItem' and @role='listitem']`,
    assigneeDisplayNameSpan: `//div[contains(@class,'flex-col')]/span[contains(@class,'font-medium')]`,
    selectedAssigneeItemByDisplayName: (displayName) =>
        `//div[@data-component='ListItem' and @role='listitem' and descendant::span[contains(@class,'font-medium') and text()='${displayName}']]`,
};

class IssueDetailsDialogAssigneesTab extends Page {
    get assigneeSelector() {
        return XPATH.container + XPATH.assigneesTabPanel + XPATH.assigneeSelectorDiv;
    }

    get assigneesOptionsFilterInput() {
        return this.assigneeSelector + COMMON.INPUTS.inputByAriaLabel('Assignees');
    }

    async waitForLoaded() {
        try {
            return await this.waitForElementDisplayed(this.assigneesOptionsFilterInput, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                'Issue Details Dialog, Assignees tab should be loaded',
                'err_assignees_tab_load',
                err,
            );
        }
    }

    // Returns display names of the selected users (list items below the options filter input):
    async getSelectedUsers() {
        let locator = this.assigneeSelector + XPATH.selectedAssigneeListItem + XPATH.assigneeDisplayNameSpan;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    // Types the display name in the options filter input then clicks on the filtered option:
    async selectUserInAssignees(userDisplayName) {
        try {
            let assigneeSelectorDropdown = new AssigneeSelectorDropdown(XPATH.container);
            await assigneeSelectorDropdown.selectFilteredUser(userDisplayName);
            await assigneeSelectorDropdown.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(
                `Assignees tab, tried to select the user: ${userDisplayName}`,
                'err_select_assignee',
                err,
            );
        }
    }

    // Clicks on 'remove' icon-button in the selected user's list item:
    async clickOnRemoveAssigneeButton(userDisplayName) {
        try {
            let locator =
                this.assigneeSelector +
                XPATH.selectedAssigneeItemByDisplayName(userDisplayName) +
                "//div[@data-component='ListItem.Right']//button";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                `Assignees tab, tried to remove the assignee: ${userDisplayName}`,
                'err_remove_assignee',
                err,
            );
        }
    }
}

module.exports = IssueDetailsDialogAssigneesTab;
