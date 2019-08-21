const Page = require('../page');
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
    includeChildrenToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    itemsToPublish: `//div[contains(@id,'TogglableStatusSelectionItem')]`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    dependantSelectionItemByDisplayName:
        text => `//ul[contains(@id,'PublishDialogDependantList')]//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    selectionItemStatusByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]//div[@class='status']`,
};

class IssueDetailsDialogRequestTab extends Page {

    get contentOptionsFilterInput() {
        return xpath.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get publishNowButton() {
        return xpath.container + xpath.buttonRow + xpath.publishNowButton;
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
        return this.waitForElementDisplayed(this.addScheduleButton, appConst.TIMEOUT_2).catch(err => {
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

    isPublishButtonDisplayed() {
        return this.isElementDisplayed(this.publishNowButton);
    }

    isPublishNowButtonEnabled() {
        return this.isElementEnabled(this.publishNowButton);
    }

    waitForPublishNowButtonDisabled() {
        return this.waitForElementDisabled(this.publishNowButton, appConst.TIMEOUT_4);
    }

    isContentOptionsFilterInputPresent() {
        return this.isElementDisplayed(this.contentOptionsFilterInput).catch(err => {
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
            await this.waitForElementDisplayed(this.showDependentItemsLink, appConst.TIMEOUT_2);
            await this.clickOnElement(this.showDependentItemsLink);
            return await this.pause(400);
        } catch (err) {
            throw new Error('error when clicking on `Show dependent items`: ' + err)
        }
    }

    isShowDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
            console.log(err);
            return false;
        })
    }

    //Hide dependent items
    async clickOnHideDependentItems() {
        try {
            await this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.TIMEOUT_2);
            await this.clickOnElement(this.hideDependentItemsLink);
            return await this.pause(300);
        } catch (err) {
            throw new Error('error when clicking on `Hide dependent items`: ' + err)
        }
    }

    isHideDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
            console.log(err);
            return false;
        })
    }

    clickOnIncludeChildItems(displayName) {
        let includeIcon = xpath.selectionItemByDisplayName(displayName) + xpath.includeChildrenToggler;
        return this.waitForElementDisplayed(includeIcon, appConst.TIMEOUT_2).then(() => {
            return this.clickOnElement(includeIcon)
        }).then(() => {
            return this.pause(2000);
        }).catch(err => {
            throw new Error('error when clicking on `Include Child items`: ' + err)
        })
    }

    excludeItem(displayName) {
        let removeIcon = xpath.dependantSelectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
        return this.waitForElementDisplayed(removeIcon, appConst.TIMEOUT_2).then(() => {
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
        return this.waitForElementDisplayed(this.publishNowButton, appConst.TIMEOUT_2).catch(err => {
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
};
module.exports = IssueDetailsDialogRequestTab;