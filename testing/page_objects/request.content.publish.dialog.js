const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const ComboBox = require('./components/loader.combobox');
const xpath = {
    container: `//div[contains(@id,'RequestContentPublishDialog')]`,
    nextButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Next')]]`,
    previousButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Previous')]]`,
    createRequestButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Create request')]]`,
    addScheduleButton: `//button[contains(@id,'ButtonEl') and contains(@class,'icon-calendar')]`,
    showDependentItemsLink: `//div[@class='dependants']/h6[contains(.,'Show dependent items')]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    warningMessagePart1: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part1']",
    warningMessagePart2: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part2']",
    contentSummaryByDisplayName:
        displayName => `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    itemToRequest:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    contentStatus:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,

};

class RequestContentPublishDialog extends Page {

    get nextButton() {
        return xpath.container + xpath.nextButton;
    }

    get cancelButtonTop() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
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

    get describeChangesInput() {
        return xpath.container + xpath.addScheduleButton;
    }

    get showDependentItemsLink() {
        return xpath.container + xpath.showDependentItemsLink;
    }

    get warningMessagePart1() {
        return xpath.container + xpath.warningMessagePart1;
    }

    async clickOnCancelButtonTop() {
        await this.clickOnElement(this.cancelButtonTop);
        return await this.waitForDialogClosed();
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
        return this.waitForElementDisplayed(xpath.container, appConst.TIMEOUT_3);
    }

    waitForNextButtonDisplayed() {
        return this.waitForElementDisplayed(this.nextButton, appConst.TIMEOUT_3);
    }

    waitForNextButtonEnabled() {
        return this.waitForElementEnabled(this.nextButton, appConst.TIMEOUT_3).catch(err => {
            throw new Error("Request Publishing dialog:  'Next' button should be enabled :" + err);
        })
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

    waitForAddScheduleButtonDisplayed() {
        return this.waitForElementDisplayed(this.addScheduleButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error("`Request Publish dialog` - Add schedule button is not present " + err);
        })
    }

    waitForAddScheduleButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.addScheduleButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error("`Request Publish dialog` - Add schedule button should not be displayed! " + err);
        })
    }

    waitForCreateRequestButtonDisabled() {
        return this.waitForElementDisabled(this.createRequestButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error("Request Publishing dialog - Create Request button should be disabled " + err);
        })
    }

    waitForCreateRequestButtonEnabled() {
        return this.waitForElementEnabled(this.createRequestButton).then(() => {
            throw new Error("Request Publishing dialog - Create Request button should be enabled" + err);
        })
    }

    async clickOnAddScheduleButton() {
        try {
            await this.waitForAddScheduleButtonDisplayed();
            return await this.clickOnElement(this.addScheduleButton);
        } catch (err) {
            this.saveScreenshot('err_publish_dialog_add_schedule_button');
            throw new Error('`Request Publish dialog` Error when clicking Add Schedule button  ' + err);
        }
    }

    getContentStatus(name) {
        let selector = xpath.contentStatus(name);
        return this.getText(selector);
    }

    async clickOnNextButton() {
        try {
            await this.waitForNextButtonDisplayed();
            return await this.clickOnElement(this.nextButton);
        } catch (err) {
            throw new Error("Request Publish Dialog -Error when clicking on Next button:" + err);
        }
    }

    async clickOnPreviousButton() {
        try {
            await this.waitForPreviousButtonDisplayed();
            return await this.clickOnElement(this.previousButton);
        } catch (err) {
            throw new Error("Request Publish Dialog -Error when clicking on Previous button:" + err);
        }
    }

    async clickOnIncludeChildItems(displayName) {
        try {
            let includeIcon = xpath.itemToRequest(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(includeIcon, appConst.TIMEOUT_2);
            await this.clickOnElement(includeIcon);
            return await this.pause(1000);
        } catch (err) {
            throw new Error('Request Publishing dialog- error when clicking on `Include Child items`: ' + err)

        }
    }

    waitForShowDependentItemsLinkDisplayed() {
        let selector = xpath.container + lib.SHOW_DEPENDENT_ITEM_LINK;
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
            throw new Error("Request Publishing Dialog - Show dependent Link " + err);
        })
    }

    async getWorkflowState(displayName) {
        let selector = xpath.contentSummaryByDisplayName(displayName);
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        let result = await this.getAttribute(selector, 'class');
        if (result.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (result.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        } else if (result === 'viewer content-summary-and-compare-status-viewer') {
            return appConst.WORKFLOW_STATE.PUBLISHED;

        } else {
            throw new Error("Error when getting content's state, class is:" + result);
        }
    }

    isWarningMessageDisplayed() {
        return this.isElementDisplayed(this.warningMessagePart1);
    }
};
module.exports = RequestContentPublishDialog;

