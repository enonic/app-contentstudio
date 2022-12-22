/**
 * Created  on 21.12.2022
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'CompareWithPublishedVersionDialog')]`,
    showEntireContent: "//div[contains(@id,'Checkbox') and child::label[text()='Show entire content']]",
};

class CompareWithPublishedVersionDialog extends Page {

    get showEntireContent() {
        return XPATH.container + XPATH.showEntireContent + '//label';
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_compare_dlg');
            await this.saveScreenshot(screenshot);
            throw new Error("Compare With Published Version Dialog  is not loaded! , screenshot" + screenshot + '  ' + err);
        }
    }

    isDialogVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    async waitForDialogClosed() {
        await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        return await this.pause(100);
    }

    isWarningMessageVisible() {
        return this.isElementDisplayed(this.warningMessage);
    }

    getWarningMessage() {
        return this.getText(this.warningMessage)
    }

    clickOnNoButton() {
        return this.clickOnElement(this.noButton);
    }
}

module.exports = ConfirmationDialog;
