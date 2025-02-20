const BaseDetailsDialog = require('./base.details.dialog')
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');

const xpath = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    buttonRow: `//div[contains(@id,'IssueDetailsDialogButtonRow')]`,
    addScheduleButton: `//button[contains(@id,'ButtonEl') and contains(@class,'icon-calendar')]`,
    itemList: `//ul[contains[@id,'PublishDialogItemList']`,
    reopenRequestButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Request']]`,
    includeChildrenToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    itemsToPublish: `//div[contains(@id,'TogglableStatusSelectionItem')]`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    dependantSelectionItemByDisplayName:
        text => `//ul[contains(@id,'PublishDialogDependantList')]//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    selectionItemStatusByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]//div[@class='status']`,
};
// Dialog loads :
// 1. after clicking on 'Create request' button in "Create request dialog"
// 2. after clicking on a request in Issues List dialog
class PublishRequestDetailsDialog extends BaseDetailsDialog {

    get publishNowButton() {
        return xpath.container + xpath.buttonRow + lib.dialogButton('Publish Now');
    }

    get closeRequestButton() {
        return xpath.container + xpath.buttonRow + lib.dialogButton('Close Request');
    }

    get reopenRequestButton() {
        return xpath.container + xpath.buttonRow + xpath.reopenRequestButton;
    }

    get addScheduleButton() {
        return xpath.container + xpath.addScheduleButton;
    }

    get itemNamesToPublish() {
        return xpath.container + xpath.itemsToPublish + lib.H6_DISPLAY_NAME;
    }

    waitForAddScheduleButtonDisplayed() {
        return this.waitForElementDisplayed(this.addScheduleButton, appConst.shortTimeout).catch(err => {
            throw new Error("`Request Publish dialog` Requests Tab - Add schedule button is not present " + err);
        })
    }

    async clickOnIncludeChildrenToggler(displayName) {
        try {
            let selector = xpath.selectionItemByDisplayName(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.TIMEOUT_1);
            await this.clickOnElement(selector);
            return this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_include_children');
            throw new Error(`Error when clicking on Include Child screenshot: ${screenshot} ` + err);
        }
    }

    // clicks on Publish... button and  opens 'Publishing Wizard'
    async clickOnPublishAndOpenPublishWizard() {
        try {
            await this.clickOnElement(this.publishButton);
            let publishContentDialog = new ContentPublishDialog();
            await publishContentDialog.waitForDialogOpened();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_publish_button');
            throw new Error(`Error when clicking on Publish button, screenshot: screenshot: ${screenshot} ` + err);
        }
    }

    isPublishNowButtonDisplayed() {
        return this.isElementDisplayed(this.publishNowButton);
    }

    waitForPublishNowButtonEnabled() {
        return this.waitForElementEnabled(this.publishNowButton, appConst.mediumTimeout);
    }

    waitForPublishNowButtonDisabled() {
        return this.waitForElementDisabled(this.publishNowButton, appConst.mediumTimeout);
    }

    async waitForContentOptionsFilterInputDisplayed() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            await contentSelectorDropdown.waitForOptionFilterInputDisplayed(xpath.container);
        } catch (err) {
            throw new Error('`Options filter input` should be displayed in Issue Details ' + err);
        }
    }

    getItemDisplayNames() {
        return this.getTextInElements(this.itemNamesToPublish).catch(err => {
            throw new Error('Items Tab:error when getting display names of items: ' + err)
        })
    }

    async getContentStatus(displayName) {
        let selector = xpath.selectionItemByDisplayName(displayName) + `//div[contains(@class,'status')][last()]`;
        let result = await this.getDisplayedElements(selector);
        return await this.getBrowser().getElementText(result[0].elementId);
    };

    async clickOnIncludeChildItems(displayName) {
        try {
            let includeIcon = xpath.selectionItemByDisplayName(displayName) + xpath.includeChildrenToggler;
            await this.waitForElementDisplayed(includeIcon, appConst.shortTimeout);
            await this.clickOnElement(includeIcon)
            return this.pause(2000);
        } catch (err) {
            throw new Error('error occurred during clicking on `Include Child items`: ' + err)
        }
    }

    async excludeItem(displayName) {
        try {
            let removeIcon = xpath.dependantSelectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
            await this.waitForElementDisplayed(removeIcon, appConst.shortTimeout);
            await this.clickOnElement(removeIcon)
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove');
            throw new Error(`error when clicking on remove icon  screenshot: ${screenshot} ` + err);
        }
    }

    async doAddItem(displayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            return await contentSelectorDropdown.selectFilteredByDisplayNameContentMulti(displayName, xpath.container);
        } catch (err) {
            throw new Error("Request Tab - Items were not added: " + err);
        }
    }

    waitForTabLoaded() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout).catch(err => {
            throw new Error("Issue Details Dialog , Requests Tab is not loaded! " + err);
        });
    }

    async clickOnAddScheduleButton() {
        try {
            await this.waitForAddScheduleButtonDisplayed();
            return await this.clickOnElement(this.addScheduleButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_schedule_button');
            throw new Error(`Request Publish dialog, Error when clicking Add Schedule button, screenshot:${screenshot}  ` + err);
        }
    }

    async clickOnCloseRequestButton() {
        try {
            await this.waitForElementDisplayed(this.closeRequestButton, appConst.shortTimeout);
            await this.clickOnElement(this.closeRequestButton);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_close_request');
            throw new Error(`Error when clicking on Close Request, screenshot:${screenshot} ` + err);
        }
    }

    async clickOnReopenRequestButton() {
        try {
            await this.waitForElementDisplayed(this.reopenRequestButton, appConst.shortTimeout);
            await this.clickOnElement(this.reopenRequestButton);
            return this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_reopen_request');
            throw new Error(`Error when clicking on Reopen Request screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnPublishNowButton() {
        try {
            await this.waitForPublishNowButtonEnabled();
            await this.clickOnElement(this.publishNowButton);
            return this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_publish_request_now');
            throw new Error(`Error when clicking on Publish Now (Request) screenshot:${screenshot} ` + err);
        }
    }

    async waitForClosed() {
        try {
            await this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
            await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_publish_request_details_closed');
            throw new Error(`Request Details dialog should be closed: screenshot:${screenshot}` + err);
        }
    }
}

module.exports = PublishRequestDetailsDialog;
