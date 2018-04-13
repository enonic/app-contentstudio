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
    includeChildrenToogler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'PublicStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]`,

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
            let xpath = xpath.selectionItemByDisplayName(displayName) + `${xpath.includeChildrenToogler}`
            this.waitForVisible(xpath, appConst.TIMEOUT_1).then(()=> {
                return this.doClick(xpath);
            }).catch(err=> {
                this.saveScreenshot('err_click_on_dependent');
                throw new Error('Error when clicking on dependant ' + displayName + ' ' + err);
            })
        }
    },
    isPublishAndCloseIssueButtonPresent: {
        value: function () {
            return this.isVisible(this.publishAndCloseIssueButton).catch(err=> {
                throw new Error('Error when checking the `Publish & Close Issue` button ' + err)
            })
        }
    },
    isContentOptionsFilterInputPresent: {
        value: function () {
            return this.isElementDisplayed(this.contentOptionsFilterInput).catch(err=> {
                throw new Error('Error when checking the `Options filter input` in Issue Details ' + err)
            })
        }
    },
    clickAndShowScheduleMenuItem: {
        value: function () {
            return this.doClick(this.menuScheduleDropDownHandle).pause(500).catch(err=> {
                throw new Error('Items Tab:error when click on dropdown handle : ' + err)
            })
        }
    },

    //Show dependent items
    clickOnShowDependentItems: {
        value: function (text) {
            return this.waitForVisible(this.showDependentItemsLink, appConst.TIMEOUT_1).then(()=> {
                return this.doClick(this.showDependentItemsLink);
            }).pause(300).catch(err=> {
                throw new Error('error when clicking on `Show dependent items`: ' + err)
            })
        }
    },
    isShowDependentItemsLinkDisplayed: {
        value: function () {
            return this.waitForVisible(this.showDependentItemsLink, appConst.TIMEOUT_2).catch(err=> {
                console.log(err);
                return false;
            })
        }
    },

    //Hide dependent items
    clickOnHideDependentItems: {
        value: function () {
            return this.waitForVisible(this.hideDependentItemsLink, appConst.TIMEOUT_2).then(()=> {
                return this.doClick(this.hideDependentItemsLink);
            }).pause(300).catch(err=> {
                throw new Error('error when clicking on `Hide dependent items`: ' + err)
            })
        }
    },
    isHideDependentItemsLinkDisplayed: {
        value: function () {
            return this.waitForVisible(this.hideDependentItemsLink, appConst.TIMEOUT_2).catch(err=> {
                console.log(err);
                return false;
            })
        }
    },
    clickOnIncludeChildItems: {
        value: function (contentDisplayName) {
            let includeIcon = xpath.selectionItemByDisplayName(contentDisplayName) + `${xpath.includeChildrenToogler}`;
            return this.waitForVisible(includeIcon, appConst.TIMEOUT_2).then(()=> {
                return this.doClick(includeIcon)
            }).pause(2000).catch(err=> {
                throw new Error('error when clicking on `Include Child items`: ' + err)
            })
        }
    },
});
module.exports = issueDetailsDialogItemsTab;
