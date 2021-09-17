const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('./../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'RequestContentPublishDialog')]`,
    nextButton: `//button[contains(@id,'ActionButton') and child::span[contains(.,'Next')]]`,
    previousButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Previous')]]`,
    createRequestButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Create request')]]`,
    changesInput: `//div[contains(@id,'InputView') and descendant::div[text()='Describe the changes']]`,
    showDependentItemsLink: `//div[@class='dependants']/h6[contains(.,'Show dependent items')]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    warningMessagePart1: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part1']",
    warningMessagePart2: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part2']",
    assigneesComboBox: "//div[contains(@id,'LoaderComboBox') and @name='principalSelector']",
    invalidIcon: "//div[contains(@class,'state-icon invalid')]",
    contentSummaryByDisplayName:
        displayName => `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    itemToRequest:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    contentStatus:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,

};
//Modal Dialog for creating of new publish request
//Select a content then expand Publish menu and click on 'Request Publishing...' menu item
class CreateRequestPublishDialog extends Page {

    get invalidIcon() {
        return xpath.container + xpath.invalidIcon;
    }

    get nextButton() {
        return xpath.container + xpath.nextButton;
    }

    get assigneesDropDownHandle() {
        return xpath.container + "//div[contains(@id,'PrincipalSelector')]" + lib.DROP_DOWN_HANDLE;
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

    get describeChangesInput() {
        return xpath.container + xpath.changesInput + lib.TEXT_INPUT;
    }

    get showDependentItemsLink() {
        return xpath.container + xpath.showDependentItemsLink;
    }

    get warningMessagePart1() {
        return xpath.container + xpath.warningMessagePart1;
    }

    get markAsReadyDropdownHandle() {
        return xpath.container + "//div[contains(@class,'modal-dialog-footer')]" + lib.DROP_DOWN_HANDLE;
    }

    async clickOnCancelButtonTop() {
        await this.clickOnElement(this.cancelButtonTop);
        return await this.waitForDialogClosed();
    }

    async isItemRemovable(displayName) {
        let selector = xpath.itemToRequest(displayName);
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        let attr = await this.getAttribute(selector, "class");
        return attr.includes("removable");
    }

    async clickOnItemToPublishAndSwitchToWizard(displayName) {
        let selector = xpath.publishItemList + xpath.itemToRequest(displayName);
        await this.clickOnElement(selector);
        await this.pause(900);
        return await this.getBrowser().switchWindow(displayName);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
    }

    waitForNextButtonDisplayed() {
        return this.waitForElementDisplayed(this.nextButton, appConst.mediumTimeout);
    }

    waitForNextButtonEnabled() {
        return this.waitForElementEnabled(this.nextButton, appConst.mediumTimeout).catch(err => {
            throw new Error("Request Publishing dialog:  'Next' button should be enabled :" + err);
        })
    }

    async waitForInvalidIconDisplayed() {
        try {
            await this.waitForElementDisplayed(this.invalidIcon, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot("err_request_publish_dialog_invalid_icon");
            throw new Error("Request Publishing dialog:  'invalid' icon should be visible :" + err);
        }
    }

    async waitForInvalidIconNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.invalidIcon, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot("err_request_publish_dialog_invalid_icon");
            throw new Error("Request Publishing dialog:  'invalid' icon should be not visible :" + err);
        }
    }

    waitForPreviousButtonDisplayed() {
        return this.waitUntilDisplayed(this.previousButton, appConst.mediumTimeout);
    }

    waitForCreateRequestButtonDisplayed() {
        return this.waitUntilDisplayed(this.createRequestButton, appConst.mediumTimeout);
    }

    async waitForDialogClosed() {
        let message = "Request publish Dialog is not closed! timeout is " + appConst.mediumTimeout;
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementNotDisplayed(xpath.container);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message});
        return await this.pause(400);
    }

    waitForCreateRequestButtonDisabled() {
        return this.waitForElementDisabled(this.createRequestButton, appConst.mediumTimeout).catch(err => {
            throw new Error("Request Publishing dialog - Create Request button should be disabled " + err);
        })
    }

    waitForCreateRequestButtonEnabled() {
        return this.waitForElementEnabled(this.createRequestButton, appConst.mediumTimeout).catch(err => {
            throw new Error("Request Publishing dialog - Create Request button should be enabled !" + err);
        })
    }

    getContentStatus(name) {
        let selector = xpath.contentStatus(name);
        return this.getText(selector);
    }

    async clickOnNextButton() {
        try {
            await this.waitForNextButtonDisplayed();
            await this.clickOnElement(this.nextButton);
            return await this.pause(300);
        } catch (err) {
            throw new Error("Request Publish Dialog -Error when clicking on Next button:" + err);
        }
    }

    async clickOnAssigneesDropDownHandle() {
        try {
            let result = await this.getDisplayedElements(this.assigneesDropDownHandle);
            await result[0].click();
            return await this.pause(300);
        } catch (err) {
            throw new Error("Request Publish Dialog -Error when clicking on Assignees button:" + err);
        }
    }

    async getAssigneesOptions() {
        let selector = xpath.container + xpath.assigneesComboBox + lib.SLICK_ROW + lib.H6_DISPLAY_NAME;
        return await this.getTextInDisplayedElements(selector);

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
            await this.waitForElementDisplayed(includeIcon, appConst.mediumTimeout);
            await this.clickOnElement(includeIcon);
            return await this.pause(1000);
        } catch (err) {
            throw new Error('Request Publishing dialog- error when clicking on `Include Child items`: ' + err)

        }
    }

    waitForShowDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.mediumTimeout).catch(err => {
            throw new Error("Request Publishing Dialog - Show dependent Link " + err);
        })
    }

    async getWorkflowState(displayName) {
        let selector = xpath.contentSummaryByDisplayName(displayName);
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
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

    async typeInChangesInput(changes) {
        await this.waitForElementDisplayed(this.describeChangesInput);
        return await this.typeTextInInput(this.describeChangesInput, changes);
    }

    async clickOnCreateRequestButton() {
        await this.waitForCreateRequestButtonEnabled();
        await this.clickOnElement(this.createRequestButton);
        return this.pause(700);
    }

    async clickOnMarkAsReadyMenuItem() {
        let locator = xpath.container + "//li[contains(@id,'MenuItem') and contains(.,'Mark as ready')]";
        await this.clickOnMarkAsReadyDropdownHandle();
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(200);
        await this.clickOnElement(locator);
        return await this.pause(200);
    }

    async clickOnMarkAsReadyDropdownHandle() {
        await this.waitForElementDisplayed(this.markAsReadyDropdownHandle, appConst.mediumTimeout);
        return await this.clickOnElement(this.markAsReadyDropdownHandle);
    }
}

module.exports = CreateRequestPublishDialog;

