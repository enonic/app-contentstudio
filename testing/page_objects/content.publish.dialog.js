const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ContentPublishDialog')]`,
    deleteButton: `//button/span[contains(.,'Delete')]`,
    publishButton: `//button[contains(@id,'ActionButton') and child::span[contains(.,'Publish')]]`,
    cancelButtonBottom: `//button[ contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    includeChildrenToogler: `//div[contains(@id,'IncludeChildrenToggler')]`,
};
class ContentPublishDialog extends Page {

    get cancelButtonBottom() {
        return XPATH.container + XPATH.cancelButtonBottom;
    }

    get publishButton() {
        return XPATH.container + XPATH.publishButton;
    }

    get includeChildrenToogler() {
        return XPATH.container + XPATH.includeChildrenToogler;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.publishButton, appConst.TIMEOUT_2);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_10).catch(err => {
            this.saveScreenshot('err_close_publish_dialog');
            throw new Error('Publish dialog must be closed ' + err);
        })
    }

    clickOnPublishButton() {
        return this.clickOnElement(this.publishButton).catch(err => {
            this.saveScreenshot('err_click_on_publish_button_publish_dialog');
            throw new Error('Error when clicking Publish dialog must be closed ' + err);
        })
    }

    clickOnIncludeChildrenToogler() {
        return this.clickOnElement(this.includeChildrenToogler).catch(err => {
            throw new Error('Error when clicking on Include Children toggler ' + err);
        })
    }

    waitForCancelButtonBottomEnabled() {
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(this.cancelButtonBottom, 'class').then(result => {
                return result.includes('enabled');
            })
        }, appConst.TIMEOUT_2).catch(err => {
            throw new Error("Publish Dialog, Button Cancel is disabled in ms: " + 2000);
        });
    }
};
module.exports = ContentPublishDialog;
