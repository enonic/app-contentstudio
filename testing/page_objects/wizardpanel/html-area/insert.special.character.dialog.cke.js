const Page = require('../../page');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'SpecialCharDialog')]`,
    title: "//h2[text()='Special character']",
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    spanChar: char => `//span[contains(@class, 'chars-block__char') and text()='${char}']`,
    spanCharByTitle: title => `//span[contains(@class, 'chars-block__char') and @title='${title}']`,
};

class InsertSpecialCharacterDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async getCharsInDialog() {
        let locator = XPATH.container + "//span[contains(@class, 'chars-block__char')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInElements(locator);
    }

    async clickOnItemByTitle(title) {
        try {
            let locator = XPATH.container + XPATH.spanCharByTitle(title);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.waitForClosed();
        } catch (err) {
            await this.handleError('Insert Special Chars dialog, error after clicking on the special char with title ' + title, 'err_spec_chars_dialog', err);
        }
    }

    async waitForDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(XPATH.title);
        } catch (err) {
            await this.handleError('Insert Special Character Dialog was not loaded', 'err_insert_spec_char_dlg', err);
        }
    }

    async waitForClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.title);
        } catch (err) {
            await this.handleError('Insert Special Character Dialog was not closed', 'err_insert_spec_char_dlg_closed', err);
        }
    }
}

module.exports = InsertSpecialCharacterDialog;

