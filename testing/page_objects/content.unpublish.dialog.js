const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ContentUnpublishDialog')]`,
    unpublishButton: "//button[contains(@id,'DialogButton') and descendant::span[contains(.,'Unpublish')]]",
    cancelButtonBottom: "//button[contains(@class,'cancel-button-bottom')]",
};
class ContentUnpublishDialog extends Page {

    get cancelButtonBottom() {
        return XPATH.container + XPATH.cancelButtonBottom;
    }

    get unpublishButton() {
        return XPATH.container + XPATH.unpublishButton;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.unpublishButton, appConst.TIMEOUT_2);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_3);
    }

    clickOnUnpublishButton() {
        return this.clickOnElement(this.unpublishButton);
    }
};
module.exports = ContentUnpublishDialog;

