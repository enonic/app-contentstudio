/**
 * Created on 19.02.2020.
 */
const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');

//Context Window, Base Inspect tab for all components
class BaseComponentInspectionPanel extends Page {

    get applyButton() {
        return "//div[contains(@id,'InspectionsPanel')]" + lib.actionButton('Apply');
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonDisplayed();
        await this.clickOnElement(this.applyButton);
        return await this.pause(2000);
    }

    waitForApplyButtonDisplayed() {
        return this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
    }
}

module.exports = BaseComponentInspectionPanel;
