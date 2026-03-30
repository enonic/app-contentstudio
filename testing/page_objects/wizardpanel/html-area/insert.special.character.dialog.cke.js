const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='SpecialCharDialog']`,
    title: "//h2[text()='Special character']",
    cancelButton: `//button[@data-area='close']`,
    spanChar: char => `//button[@title and text()='${char}']`,
    spanCharByTitle: title => `//button[@title='${title}']`,
};

class InsertSpecialCharacterDialog extends Page {

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    clickOnCloseButton() {
        return this.clickOnElement(this.closeButton);
    }

    async getCharsInDialog() {
        let locator = XPATH.container + "//button[@title]";
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
            await this.handleError('Insert Special Chars dialog, error after clicking on the special char with title ' + title,
                'err_spec_chars_dialog', err);
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

