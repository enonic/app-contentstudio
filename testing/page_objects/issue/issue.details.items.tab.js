const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    hideDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Hide dependent items')]`,
    showDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Show dependent items')]`,
    buttonRow: `//div[contains(@id,'IssueDetailsDialogButtonRow')]`,
    itemList: `//ul[contains[@id,'PublishDialogItemList']`,
    publishAndCloseIssueButton: `//button[contains(@id,'ActionButton') and child::span[contains(.,'Publish & Close Issue')]]`,
    includeChildrenToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    itemsToPublish: `//div[contains(@id,'TogglableStatusSelectionItem')]`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    dependantSelectionItemByDisplayName:
        text => `//ul[contains(@id,'PublishDialogDependantList')]//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    selectionItemStatusByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]//div[@class='status']`,
};

class IssueDetailsDialogItemsTab extends Page {

    get contentOptionsFilterInput() {
        return xpath.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get publishAndCloseIssueButton() {
        return xpath.buttonRow + xpath.publishAndCloseIssueButton;
    }

    get itemNamesToPublish() {
        return xpath.container + xpath.itemsToPublish + lib.H6_DISPLAY_NAME;
    }

    get hideDependentItemsLink() {
        return `${xpath.container}` + `${xpath.hideDependentItemsLink}`;
    }

    get showDependentItemsLink() {
        return xpath.container + xpath.showDependentItemsLink;
    }


    get menuScheduleDropDownHandle() {
        return xpath.buttonRow + lib.DROP_DOWN_HANDLE;
    }

    clickOnIncludeChildrenToggler(displayName) {
        let selector = xpath.selectionItemByDisplayName(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_1).then(() => {
            return this.clickOnElement(selector);
        }).then(() => {
            return this.pause(1000);
        }).catch(err => {
            this.saveScreenshot('err_click_on_dependent');
            throw new Error('Error when clicking on dependant ' + displayName + ' ' + err);
        })
    }

    clickOnPublishAndCloseIssueButton() {
        return this.clickOnElement(this.publishAndCloseIssueButton).catch(err => {
            this.saveScreenshot('err_click_on_publish_and_close');
            throw new Error('Error when clicking on Publish and close ' + err);
        }).then(()=>{
            return this.pause(1700);
        })
    }

    isPublishAndCloseIssueButtonPresent() {
        return this.isElementDisplayed(this.publishAndCloseIssueButton);
    }

    isPublishAndCloseIssueButtonEnabled() {
        return this.isElementEnabled(this.publishAndCloseIssueButton);
    }

    waitForPublishAndCloseIssueButtonEnabled() {
        return this.waitForElementEnabled(this.publishAndCloseIssueButton, appConst.TIMEOUT_3);
    }

    isContentOptionsFilterInputPresent() {
        return this.isElementDisplayed(this.contentOptionsFilterInput).catch(err => {
            throw new Error('Error when checking the `Options filter input` in Issue Details ' + err)
        })
    }

    clickAndShowScheduleMenuItem() {
        return this.clickOnElement(this.menuScheduleDropDownHandle).pause(500).catch(err => {
            throw new Error('Items Tab:error when click on dropdown handle : ' + err)
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
        return await this.getBrowser().getElementText(result[0].ELEMENT);
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
};
module.exports = IssueDetailsDialogItemsTab;
