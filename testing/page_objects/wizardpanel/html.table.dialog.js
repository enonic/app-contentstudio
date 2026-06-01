const Page = require('../page');
const {COMMON, BUTTONS} = require('../../libs/elements');

const xpath = {
    container: `//div[@data-component='TableDialog']`,
    okButton: "//button[contains(@id,'DialogButton') and child::span[text()='OK']]",
};

class HtmlTableDialog extends Page {

    get rowsInput() {
        return xpath.container +
               "//label[child::span[contains(@class,'font-semibold') and normalize-space(text())='Rows']]" +
               "//input[@data-component='LongInput']";
    }

    get columnsInput() {
        return xpath.container +
               "//label[child::span[contains(@class,'font-semibold') and normalize-space(text())='Columns']]" +
               "//input[@data-component='LongInput']";
    }

    get okButton() {
        return xpath.container + BUTTONS.submitButtonByLabel("OK");
    }

    waitForOkButtonDisplayed() {
        return this.waitForElementDisplayed(this.okButton);
    }

    async typeTextInRowsInput(rowsNumber) {
        await this.waitForElementDisplayed(this.rowsInput);
        await this.typeTextInInput(this.rowsInput, rowsNumber);
        return await this.pause(200);
    }
    async clearRowsInput() {
        await this.waitForElementDisplayed(this.rowsInput);
        await this.clearInputText(this.rowsInput);
        return await this.pause(200);
    }
    async clearColumnsInput() {
        await this.waitForElementDisplayed(this.columnsInput);
        await this.clearInputText(this.columnsInput);
        return await this.pause(200);
    }

    async typeTextInColumnsInput(columnsNumber) {
        await this.waitForElementDisplayed(this.columnsInput);
        await this.typeTextInInput(this.columnsInput, columnsNumber);
        return await this.pause(200);
    }

    async clickOnOkButton() {
        await this.waitForOkButtonDisplayed();
        return await this.clickOnElement(this.okButton);
    }

    async waitForDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(this.okButton);
        } catch (err) {
            await this.handleError('Html Table Dialog - tried to wait for dialog loaded: ', 'err_wait_for_table_dialog', err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(xpath.container);
    }
}

module.exports = HtmlTableDialog;

