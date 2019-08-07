const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const xpath = {
    container: `//div[contains(@id,'RequestContentPublishDialog')]`,
    nextButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Next')]]`,
    previousButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Previous')]]`,
    createRequestButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Create request')]]`,
    addScheduleButton: `//button[contains(@id,'ActionButton') and child::span[contains(.,'Add schedule')]]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    itemToRequest:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    contentStatus:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,

};

class RequestContentPublishDialog extends Page {

    get nextButton() {
        return xpath.container + xpath.nextButton;
    }

    get previousButton() {
        return xpath.container + xpath.previousButton;
    }

    get createRequestButton() {
        return xpath.container + xpath.createRequestButton;
    }

    get addScheduleButton() {
        return xpath.container + xpath.addScheduleButton;
    }

    async isItemRemovable(displayName) {
        let selector = xpath.itemToRequest(displayName);
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        let attr = await this.getAttribute(selector, "class");
        return attr.includes("removable");
    }

    async clickOnItemToPublishAndSwitchToWizard(displayName) {
        let selector = xpath.publishItemList + xpath.itemToRequest(displayName);
        await this.clickOnElement(selector);
        return await this.getBrowser().switchWindow(displayName);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_3);
    }

    waitForNextButtonDisplayed() {
        return this.waitForElementDisplayed(this.nextButton, appConst.TIMEOUT_3);
    }

    waitForPreviousButtonDisplayed() {
        return this.waitUntilDisplayed(this.previousButton, appConst.TIMEOUT_3);
    }

    waitForCreateRequestButtonDisplayed() {
        return this.waitUntilDisplayed(this.createRequestButton, appConst.TIMEOUT_3);
    }

    waitForCreateRequestButtonEnabled() {
        return this.waitUntilDisplayed(this.createRequestButton, appConst.TIMEOUT_3);
    }

    waitForDialogClosed() {
        let message = "Request publish Dialog is not closed! timeout is " + 3000;
        return this.getBrowser().waitUntil(() => {
            return this.isElementNotDisplayed(xpath.container);
        }, appConst.TIMEOUT_3, message).then(() => {
            return this.pause(400);
        })
    }

    waitForScheduleButtonDisplayed() {
        return this.waitForElementDisplayed(this.addScheduleButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error("`Request Publish dialog` - Add schedule button is not present " + err);
        })
    }

    clickOnAddScheduleButton() {
        return this.clickOnElement(this.addScheduleButton).catch(err => {
            this.saveScreenshot('err_publish_dialog_add_schedule_button');
            throw new Error('`Request Publish dialog` Error when clicking Add Schedule button  ' + err);
        })
    }

    getContentStatus(name) {
        let selector = xpath.contentStatus(name);
        return this.getText(selector);
    }

};
module.exports = RequestContentPublishDialog;

