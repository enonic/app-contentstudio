const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
};

class IssueDetailsDialogAssigneesTab extends Page {

    get principalComboBox() {
        return XPATH.container + lib.PRINCIPAL_COMBOBOX;
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.principalComboBox).catch(err => {
            throw  new Error('Task Details Dialog, Assignees tab  ' + err);
        })
    }

    getSelectedUsers() {
        let locator = this.principalComboBox + lib.PRINCIPAL_SELECTED_OPTION + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(locator);
    }
}
module.exports = IssueDetailsDialogAssigneesTab;
