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
    itemList: `//ul[contains[@id,'PublishDialogItemList']`,
    publishButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Publish...')]]`,
    closeTaskButton: `//button[contains(@id,'DialogButton') and child::span[text()='Close Task']]`,
    reopenTaskButton: `//button[contains(@id,'DialogButton') and child::span[text()='Reopen Task']]`,
    includeChildrenToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    itemsToPublish: `//div[contains(@id,'TogglableStatusSelectionItem')]`,
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    dependantItemViewer: "//div[contains(@id,'DependantItemViewer')]",
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    dependantSelectionItemByDisplayName:
        text => `//ul[contains(@id,'PublishDialogDependantList')]//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    selectionItemStatusByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]//div[@class='status']`,
};

class TaskDetailsDialogItemsTab extends Page {

    get contentOptionsFilterInput() {
        return xpath.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get closeTaskButton() {
        return xpath.container + xpath.closeTaskButton;
    }

    get reopenTaskButton() {
        return xpath.container + xpath.reopenTaskButton;
    }

    get publishButton() {
        return xpath.container + xpath.buttonRow + xpath.publishButton;
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

    async clickOnIncludeChildrenToggler(displayName) {
        try {
            let selector = xpath.selectionItemByDisplayName(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_click_on_dependent');
            throw new Error('Error when clicking on dependant ' + displayName + ' ' + err);
        }
    }

    // clicks on Publish... button and  opens 'Publishing Wizard'
    async clickOnPublishAndOpenPublishWizard() {
        try {
            let res = await this.findElements(this.publishButton);
            await this.clickOnElement(this.publishButton);
            let publishContentDialog = new ContentPublishDialog();
            await publishContentDialog.waitForDialogOpened();
            return publishContentDialog;
        } catch (err) {
            this.saveScreenshot('err_click_on_publish_and_close');
            throw new Error('Error when clicking on Publish and close ' + err);
        }
    }

    isPublishButtonDisplayed() {
        return this.isElementDisplayed(this.publishButton);
    }

    isPublishButtonEnabled() {
        return this.isElementEnabled(this.publishButton);
    }

    async waitForPublishButtonEnabled() {
        return await this.waitForElementEnabled(this.publishButton, appConst.mediumTimeout);
    }

    waitForContentOptionsFilterInputDisplayed() {
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
    async clickOnShowDependentItems() {
        try {
            await this.waitForElementDisplayed(this.showDependentItemsLink, appConst.longTimeout);
            await this.clickOnElement(this.showDependentItemsLink);
            return await this.pause(400);
        } catch (err) {
            throw new Error('error when clicking on `Show dependent items`: ' + err)
        }
    }

    waitForShowDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_show_dep_items_link_should_be_displayed");
            throw new Error("Show Dependent Items link should be displayed! " + err);
        })
    }

    //Hide dependent items
    async clickOnHideDependentItems() {
        try {
            await this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.shortTimeout);
            await this.clickOnElement(this.hideDependentItemsLink);
            return await this.pause(300);
        } catch (err) {
            throw new Error('error when clicking on `Hide dependent items`: ' + err)
        }
    }

    waitForHideDependentItemsLinkDisplayed() {
        return this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_hide_dependent_items_should_be_displayed");
            throw new Error("Hide Dependent Items link should be displayed! " + err);
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

    excludeDependantItem(displayName) {
        let removeIcon = xpath.dependantSelectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
        return this.waitForElementDisplayed(removeIcon, appConst.shortTimeout).then(() => {
            return this.clickOnElement(removeIcon)
        }).then(() => {
            return this.pause(1000);
        }).catch(err => {
            throw new Error('error when clicking on `remove icon`: ' + err)
        })
    }

    excludeItem(displayName) {
        let removeIcon = xpath.selectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
        return this.waitForElementDisplayed(removeIcon, appConst.shortTimeout).then(() => {
            return this.clickOnElement(removeIcon)
        }).then(() => {
            return this.pause(1000);
        }).catch(err => {
            throw new Error('error when clicking on `remove icon`: ' + err)
        })
    }

    async clickOnCloseTaskButton() {
        try {
            await this.waitForElementDisplayed(this.closeTaskButton, appConst.mediumTimeout);
            await this.clickOnElement(this.closeTaskButton);
            //Reopen Task button should appear!
            return await this.waitForElementDisplayed(this.reopenTaskButton, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_click_close_task_button');
            throw  new Error('Error when clicking on the `Close Task`  ' + err);
        }
    }

    async waitForReopenTaskButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.reopenTaskButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Reopen Task button is not displayed: " + err)
        }
    }

    async addItem(itemDisplayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            return await loaderComboBox.typeTextAndSelectOption(itemDisplayName, xpath.container);
        } catch (err) {
            throw new Error("Task Details dialog -  " + err);
        }
    }

    async getDisplayNameInDependentItems() {
        let locator = xpath.container + xpath.dependantList + xpath.dependantItemViewer + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(locator);
    }
};
module.exports = TaskDetailsDialogItemsTab;
