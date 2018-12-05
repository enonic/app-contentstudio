const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const htmlArea = require('../../page_objects/components/htmlarea');

const xpath = {
    container: `//div[contains(@id,'FullscreenDialog')]`,
};

const htmlFullScreenDialog = Object.create(page, {

    cancelButtonTop: {
        get: function () {
            return `${xpath.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },
    clickOnCancelButtonTop: {
        value: function () {
            return this.doClick(this.cancelButtonTop);
        }
    },
    waitForDialogLoaded: {
        value: function () {
            return this.waitForVisible(xpath.container, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_full_screen_dialog');
                throw new Error('Full Screen Dialog must be opened!' + err);
            });
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_2);
        }
    },

    typeTextInHtmlArea: {
        value: function (strings) {
            return htmlArea.typeTextInHtmlArea(xpath.container, text);
        }
    },
    getTextFromHtmlArea: {
        value: function () {
            return htmlArea.getTextFromHtmlArea(xpath.container);
        }
    },
});
module.exports = htmlFullScreenDialog;

