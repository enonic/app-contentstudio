/**
 * Created on 03.11.2017.
 */
const page = require('./page');
const dialog = {
    container: `//div[contains(@id,'SaveBeforeCloseDialog')]`,
    yesButton: `//button[contains(@id,'DialogButton') and child::span[text()='Yes']]`,
    noButton: `//div[@class='dialog-buttons']//button/span[text()='No']`,
};
var saveBeforeCloseDialog = Object.create(page, {

    warningMessage: {
        get: function () {
            return `${dialog.container}//h6[text()='There are unsaved changes, do you want to save them before closing?']`;
        }
    },
    yesButton: {
        get: function () {
            return `${dialog.container}//button[contains(@id,'DialogButton') and child::span[text()='Yes']]`

        }
    },
    noButton: {
        get: function () {
            return `${dialog.container}//div[@class='dialog-buttons']//button/span[text()='No']`
        }
    },
    clickOnYesButton: {
        value: function () {
            return this.doClick(this.yesButton).then(()=> {
                return this.waitForNotVisible(`${dialog.container}`, 2000);
            });
        }
    },
    waitForDialogVisible: {
        value: function (ms) {
            return this.waitForVisible(`${dialog.container}`, ms);
        }
    },
    waitForDialogClosed: {
        value: function (ms) {
            return this.waitForVisible(`${dialog.container}`, ms);
        }
    },
    isWarningMessageVisible: {
        value: function () {
            return this.isVisible(this.warningMessage);
        }
    },
    isDialogPresent: {
        value: function () {
            return this.isVisible(`${dialog.container}`);
        }
    },
    clickOnNoButton: {
        value: function () {
            return this.doClick(this.noButton);
        }
    },
});
module.exports = saveBeforeCloseDialog;




