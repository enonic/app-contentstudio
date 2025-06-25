/**
 * Created on 31.10.2022
 */
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const ContentWizardPanel = require('./content.wizard.panel');

const XPATH = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
    toolbar: `//div[contains(@id,'ContentWizardToolbar')]`,
    publishMenuButton: "//div[contains(@id,'ContentWizardPublishMenuButton')]//button[contains(@id,'DropdownHandle')]",
};

class MobileContentWizardPanel extends ContentWizardPanel {

    get moreButton() {
        return XPATH.toolbar + lib.MORE_FOLD_BUTTON
    }

    waitForMoreFoldButtonDisplayed() {
        return this.waitForElementDisplayed(this.moreButton, appConst.mediumTimeout);
    }

    async clickOnMoreFoldButton() {
        await this.waitForMoreFoldButtonDisplayed();
        await this.clickOnElement(this.moreButton);
        return this.pause(200);
    }

    async getPublishMenuDropdownCSSProperty(property) {
        let elem = this.findElement(XPATH.container + XPATH.publishMenuButton);
        let result = await elem.getCSSProperty(property);
        return result.value;
    }

    async isPublishMenuDropdownIconDown() {
        let elem = this.findElement(XPATH.container + XPATH.publishMenuButton);
        let result = await elem.getAttribute('class');
        return result.includes("arrow_drop_down down");
    }
}

module.exports = MobileContentWizardPanel;
