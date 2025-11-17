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

    async waitForAddScheduleButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.addScheduleButton, appConst.shortTimeout)
        } catch (err) {
            await this.handleError(`Request Publish dialog Requests Tab - 'Add schedule' button is not displayed`, 'err_schedule_button',
                err);
        }
    }

    async clickOnIncludeChildrenToggler(displayName) {
        try {
            let selector = xpath.selectionItemByDisplayName(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.TIMEOUT_1);
            await this.clickOnElement(selector);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Error during clicking on Include Child Items toggle`, 'err_click_on_include_children', err);
        }
    }

    // clicks on Publish... button and  opens 'Publishing Wizard'
    async clickOnPublishAndOpenPublishWizard() {
        try {
            await this.clickOnElement(this.publishButton);
            let publishContentDialog = new ContentPublishDialog();
            await publishContentDialog.waitForDialogOpened();
        } catch (err) {
            await this.handleError(`Error during clicking on Publish button to open Publishing Wizard`, 'err_publish_button', err);
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
            throw new Error(`Options filter input should be displayed in Issue Details ` + err);
        }
    }

    async getItemDisplayNames() {
        try {
            return await this.getTextInElements(this.itemNamesToPublish);
        } catch (err) {
            await this.handleError(`Items Tab: tried to get display names of items`, 'err_items_names', err);
        }
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
            await this.handleError(`Request Publish dialog, Request Tab - Error when adding item: ${displayName}`,
                'err_add_item_request_tab', err);
        }
    }

    async waitForTabLoaded() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
            await this.pause(300);
        } catch (err) {
            await this.handleError("Issue Details Dialog , Requests Tab is not loaded! ", 'err_request_tab_loaded', err);
        }
    }

    async clickOnAddScheduleButton() {
        try {
            await this.waitForAddScheduleButtonDisplayed();
            return await this.clickOnElement(this.addScheduleButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_schedule_button');
            throw new Error(`Request Publish dialog - Error after clicking on Add Schedule button, screenshot:${screenshot} ` + err);
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
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Publish Request Dialog , Error during clicking on Reopen Request`, 'err_click_on_reopen_request', err);
        }
    }

    async clickOnPublishNowButton() {
        try {
            await this.waitForPublishNowButtonEnabled();
            await this.pause(300);
            await this.clickOnElement(this.publishNowButton);
            return await this.pause(700);
        } catch (err) {
            await this.handleError(`Error during clicking on Publish Now (Request)`, 'err_click_on_publish_request_now', err);
        }
    }

    async waitForClosed() {
        try {
            await this.waitForElementNotDisplayed(xpath.container, appConst.mediumTimeout);
            await this.pause(500);
        } catch (err) {
            await this.handleError(`Request Details dialog should be closed`, 'err_publish_request_details_closed', err);
        }
    }
}

module.exports = PublishRequestDetailsDialog;
