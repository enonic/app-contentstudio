const page = require('../page');
const elements = require('../../libs/elements');
const loaderComboBox = require('../components/loader.combobox');
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
const issueDetailsDialogItemsTab = Object.create(page, {

    contentOptionsFilterInput: {
        get: function () {
            return `${xpath.container}` + `${loaderComboBox.optionsFilterInput}`;
        }
    },
    publishAndCloseIssueButton: {
        get: function () {
            return `${xpath.buttonRow}` + `${xpath.publishAndCloseIssueButton}`;
        }
    },
    itemNamesToPublish: {
        get: function () {
            return `${xpath.container}` + `${xpath.itemsToPublish}` + elements.H6_DISPLAY_NAME;
        }
    },
    hideDependentItemsLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.hideDependentItemsLink}`;
        }
    },
    showDependentItemsLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.showDependentItemsLink}`;
        }
    },

    menuScheduleDropDownHandle: {
        get: function () {
            return `${xpath.buttonRow}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    clickOnIncludeChildrenToggler: {
        value: function (displayName) {
            let selector = xpath.selectionItemByDisplayName(displayName) + `${elements.INCLUDE_CHILDREN_TOGGLER}`
            return this.waitForVisible(selector, appConst.TIMEOUT_1).then(() => {
                return this.doClick(selector);
            }).catch(err => {
                this.saveScreenshot('err_click_on_dependent');
                throw new Error('Error when clicking on dependant ' + displayName + ' ' + err);
            })
        }
    },
    clickOnPublishAndCloseIssueButton: {
        value: function () {
            return this.doClick(this.publishAndCloseIssueButton).catch(err => {
                this.saveScreenshot('err_click_on_publish_and_close');
                throw new Error('Error when clicking on Publish and close ' + err);
            })
        }
    },
    isPublishAndCloseIssueButtonPresent: {
        value: function () {
            return this.isVisible(this.publishAndCloseIssueButton).catch(err => {
                throw new Error('Error when checking the `Publish & Close Issue` button ' + err)
            })
        }
    },
    isPublishAndCloseIssueButtonEnabled: {
        value: function () {
            return this.isEnabled(this.publishAndCloseIssueButton);
        }
    },
    waitForPublishAndCloseIssueButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.publishAndCloseIssueButton,appConst.TIMEOUT_3);
        }
    },
    isContentOptionsFilterInputPresent: {
        value: function () {
            return this.isElementDisplayed(this.contentOptionsFilterInput).catch(err => {
                throw new Error('Error when checking the `Options filter input` in Issue Details ' + err)
            })
        }
    },
    clickAndShowScheduleMenuItem: {
        value: function () {
            return this.doClick(this.menuScheduleDropDownHandle).pause(500).catch(err => {
                throw new Error('Items Tab:error when click on dropdown handle : ' + err)
            })
        }
    },
    getNumberInDependentItemsLink: {
        value: function () {
            return this.getText(this.showDependentItemsLink).then(result => {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            }).catch(err => {
                throw new Error('Items Tab:error when getting number in the link : ' + err)
            })
        }
    },
    getItemDisplayNames: {
        value: function () {
            return this.getText(this.itemNamesToPublish).catch(err => {
                throw new Error('Items Tab:error when getting display names of items: ' + err)
            })
        }
    },

    getContentStatus: {
        value: function (displayName) {
            let selector = xpath.selectionItemByDisplayName(displayName) + `//div[contains(@class,'status')][last()]`;
            return this.getDisplayedElements(selector).then(result => {
                return this.getBrowser().elementIdText(result[0].ELEMENT);
            }).then(result => {
                return result.value;
            }).catch(err => {
                this.saveScreenshot('err_items_tab_getting_status');
                throw Error('Error when getting of content status. items tab, issue details dialog ');
            })
        }
    },
    //Show dependent items
    clickOnShowDependentItems: {
        value: function (text) {
            return this.waitForVisible(this.showDependentItemsLink, appConst.TIMEOUT_2).then(() => {
                return this.doClick(this.showDependentItemsLink);
            }).pause(400).catch(err => {
                throw new Error('error when clicking on `Show dependent items`: ' + err)
            })
        }
    },
    isShowDependentItemsLinkDisplayed: {
        value: function () {
            return this.waitForVisible(this.showDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
                console.log(err);
                return false;
            })
        }
    },

    //Hide dependent items
    clickOnHideDependentItems: {
        value: function () {
            return this.waitForVisible(this.hideDependentItemsLink, appConst.TIMEOUT_2).then(() => {
                return this.doClick(this.hideDependentItemsLink);
            }).pause(300).catch(err => {
                throw new Error('error when clicking on `Hide dependent items`: ' + err)
            })
        }
    },
    isHideDependentItemsLinkDisplayed: {
        value: function () {
            return this.waitForVisible(this.hideDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
                console.log(err);
                return false;
            })
        }
    },
    clickOnIncludeChildItems: {
        value: function (displayName) {
            let includeIcon = xpath.selectionItemByDisplayName(displayName) + `${xpath.includeChildrenToggler}`;
            return this.waitForVisible(includeIcon, appConst.TIMEOUT_2).then(() => {
                return this.doClick(includeIcon)
            }).pause(2000).catch(err => {
                throw new Error('error when clicking on `Include Child items`: ' + err)
            })
        }
    },
    excludeItem: {
        value: function (displayName) {
            let removeIcon = xpath.dependantSelectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
            return this.waitForVisible(removeIcon, appConst.TIMEOUT_2).then(() => {
                return this.doClick(removeIcon)
            }).pause(1000).catch(err => {
                throw new Error('error when clicking on `remove icon`: ' + err)
            })
        }
    },

});
module.exports = issueDetailsDialogItemsTab;
