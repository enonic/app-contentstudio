const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'TableDialog')]`,
    okButton: "//button[contains(@id,'DialogButton') and child::span[text()='OK']]",
};

class HtmlTableDialog extends Page {

    get rowsInput() {
        return xpath.container + "//div[contains(@id,'FormItem') and descendant::span[text()='Rows']]" + lib.TEXT_INPUT;
    }

    get columnsInput() {
        return xpath.container + "//div[contains(@id,'FormItem') and descendant::span[text()='Columns']]" + lib.TEXT_INPUT;
    }

    get okButton() {
        return xpath.container + xpath.okButton;
    }

    waitForOkButtonDisplayed() {
        return this.waitForElementDisplayed(this.okButton, appConst.mediumTimeout);
    }

    async typeTextInRowsInput(rowsNumber) {
        await this.waitForElementDisplayed(this.rowsInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.rowsInput, rowsNumber);
        return await this.pause(200);
    }

    async typeTextInColumnsInput(columnsNumber) {
        await this.waitForElementDisplayed(this.columnsInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.columnsInput, columnsNumber);
        return await this.pause(200);
    }

    async clickOnOkButton() {
        await this.waitForOkButtonDisplayed();
        return await this.clickOnElement(this.okButton);
    }

    async waitForDialogLoaded() {
        try {
            let res = await this.findElements(this.okButton);
            return await this.waitForElementDisplayed(this.okButton, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_open_table_dialog');
            throw new Error('Table Dialog must be opened! screenshot ' + screenshot + ' ' + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
    }
}

module.exports = HtmlTableDialog;

