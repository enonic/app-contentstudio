const BaseDetailsDialog = require('./base.details.dialog')
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const LoaderComboBox = require('../components/loader.combobox');

const xpath = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    hideDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Hide dependent items')]`,
    showDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Show dependent items')]`,
    buttonRow: `//div[contains(@id,'IssueDetailsDialogButtonRow')]`,
    addScheduleButton: `//button[contains(@id,'ButtonEl') and contains(@class,'icon-calendar')]`,
    itemList: `//ul[contains[@id,'PublishDialogItemList']`,
    publishNowButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Publish Now')]]`,
    closeRequestButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Close Request')]]`,
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
//Dialog loads :
// 1. after clicking on 'Create request' button in "Create request dialog"
//2. after clicking on a request in Issues List dialog
class PublishRequestDetailsDialog extends BaseDetailsDialog {

    get contentOptionsFilterInput() {
        return xpath.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get publishNowButton() {
        return xpath.container + xpath.buttonRow + xpath.publishNowButton;
    }

    get closeRequestButton() {
        return xpath.container + xpath.buttonRow + xpath.closeRequestButton;
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

    get hideDependentItemsLink() {
        return xpath.container + xpath.hideDependentItemsLink;
    }

    get showDependentItemsLink() {
        return xpath.container + xpath.showDependentItemsLink;
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
            this.saveScreenshot('err_click_on_include_children');
            throw new Error('Error when clicking on Include Child ' + displayName + ' ' + err);
        }
    }

    // clicks on Publish... button and  opens 'Publishing Wizard'
    async clickOnPublishAndOpenPublishWizard() {
        try {
            let res = await this.findElements(this.publishButton);
            await this.clickOnElement(this.publishButton);
            let publishContentDialog = new ContentPublishDialog();
            publishContentDialog.waitForDialogOpened();
        } catch (err) {
            this.saveScreenshot('err_click_on_publish_and_close');
            throw new Error('Error when clicking on Publish and close ' + err);
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

    waitContentOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.contentOptionsFilterInput, appConst.mediumTimeout).catch(err => {
            throw new Error('Error when checking the `Options filter input` in Issue Details ' + err)
        })
    }

    getNumberInDependentItemsLink() {
        return this.getText(this.showDependentItemsLink).then(result => {
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        }).catch(err => {
            throw new Error('Items Tab:error when getting number in the link : ' + err)
        })
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


    //Show dependent items
    async clickOnShowDependentItems(text) {
        try {
            await this.waitForElementDisplayed(this.showDependentItemsLink, appConst.mediumTimeout);
            await this.clickOnElement(this.showDependentItemsLink);
            return await this.pause(400);
        } catch (err) {
            throw new Error('error when clicking on `Show dependent items`: ' + err)
        }
    }

    isShowDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.mediumTimeout).catch(err => {
            console.log(err);
            return false;
        })
    }

    //Hide dependent items
    async clickOnHideDependentItems() {
        try {
            await this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.mediumTimeout);
            await this.clickOnElement(this.hideDependentItemsLink);
            return await this.pause(300);
        } catch (err) {
            throw new Error('error when clicking on `Hide dependent items`: ' + err)
        }
    }

    isHideDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_hide_dependent_items_should_be_displayed");
            throw new Error("Publish request -Hide Dependent Items link should be displayed! " + err)
        })
    }

    clickOnIncludeChildItems(displayName) {
        let includeIcon = xpath.selectionItemByDisplayName(displayName) + xpath.includeChildrenToggler;
        return this.waitForElementDisplayed(includeIcon, appConst.shortTimeout).then(() => {
            return this.clickOnElement(includeIcon)
        }).then(() => {
            return this.pause(2000);
        }).catch(err => {
            throw new Error('error when clicking on `Include Child items`: ' + err)
        })
    }

    excludeItem(displayName) {
        let removeIcon = xpath.dependantSelectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
        return this.waitForElementDisplayed(removeIcon, appConst.shortTimeout).then(() => {
            return this.clickOnElement(removeIcon)
        }).then(() => {
            return this.pause(1000);
        }).catch(err => {
            throw new Error('error when clicking on `remove icon`: ' + err)
        })
    }

    async doAddItem(displayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            return await loaderComboBox.typeTextAndSelectOption(displayName, xpath.container);
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
            this.saveScreenshot('err_publish_dialog_add_schedule_button');
            throw new Error('`Request Publish dialog` Error when clicking Add Schedule button  ' + err);
        }
    }

    async clickOnCloseRequestButton() {
        try {
            await this.waitForElementDisplayed(this.closeRequestButton, appConst.shortTimeout);
            await this.clickOnElement(this.closeRequestButton);
            return this.pause(1000);
        } catch (err) {
            this.saveScreenshot('err_click_on_close_request');
            throw new Error('Error when clicking on Close Request ' + err);
        }
    }

    async clickOnReopenRequestButton() {
        try {
            await this.waitForElementDisplayed(this.reopenRequestButton, appConst.shortTimeout);
            await this.clickOnElement(this.reopenRequestButton);
            return this.pause(1000);
        } catch (err) {
            this.saveScreenshot('err_click_on_reopen_request');
            throw new Error('Error when clicking on Reopen Request ' + err);
        }
    }

    async clickOnPublishNowButton() {
        try {
            await this.waitForPublishNowButtonEnabled();
            await this.clickOnElement(this.publishNowButton);
            return this.pause(1000);
        } catch (err) {
            this.saveScreenshot('err_click_on_publish_request_now');
            throw new Error('Error when clicking on Publish Now (Request) ' + err);
        }
    }

    async waitForClosed() {
        try {
            return await this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Request Details dialog should be closed: " + err);
        }
    }
};
module.exports = PublishRequestDetailsDialog;