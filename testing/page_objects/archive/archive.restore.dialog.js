/**
 * Created on 5.11.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ArchiveRestoreDialog')]`,
    restoreButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Restore']]`,
    itemListToRestore: "//ul[contains(@id,'ArchiveDialogItemList')]",
    childListToRestore:"//ul[contains(@id,'ArchiveItemsList')]",
    header: `//div[contains(@id,'DefaultModalDialogHeader')]`,
    contentTypeByName: function (name) {
        return `//div[@class='content-types-content']//li[contains(@class,'content-types-list-item') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`;
    },
};

class ArchiveRestoreDialog extends Page {

    get title() {
        return XPATH.container + XPATH.header + "//h2[@class='title']";
    }

    get restoreButton() {
        return XPATH.container + XPATH.restoreButton;
    }

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_DIALOG;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnCancelButtonTop() {
        return this.clickOnElement(this.cancelButtonTop);
    }

    async clickOnCancelButton() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.cancelButton);
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(this.restoreButton, appConst.mediumTimeout)
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_restore_dlg'));
            throw new Error('Restore from Archive dialog was not loaded! ' + err);
        }
    }

    async waitForClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (error) {
            await this.saveScreenshot(appConst.generateRandomName('err_restore_dlg_close'));
            throw new Error('Restore from Archive dialog was not closed ' + err);
        }
    }

    getTitleInHeader() {
        return this.getText(this.title);
    }

    async clickOnRestoreButton() {
        await this.waitForRestoreButtonDisplayed();
        return await this.clickOnElement(this.restoreButton);
    }

    waitForRestoreButtonDisplayed() {
        return this.waitForElementDisplayed(this.restoreButton, appConst.mediumTimeout);
    }
}

module.exports = ArchiveRestoreDialog;
