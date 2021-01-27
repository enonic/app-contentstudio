/**
 * Created on 19.02.2020.
 */

const Page = require('../../../page');
const lib = require('../../../../libs/elements');

//Context Window, Base Inspect tab for all components
class BaseComponentInspectionPanel extends Page {

    async clickOnApplyButton() {
        let selector = "//div[contains(@id,'ContextWindow')]" + lib.ACTION_BUTTON + "/span[text()='Apply']";
        await this.clickOnElement(selector);
        return this.pause(2000);
    }
}
module.exports = BaseComponentInspectionPanel;
