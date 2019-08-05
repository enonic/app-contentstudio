const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ContentPublishDialog')]`,
    logMessageLink: `//div[contains(@id,'ContentPublishDialogSubTitle')]/a`,
    publishNowButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Publish Now')]]`,
    cancelButtonTop: `//button[ contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    includeChildrenToogler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    showDependentItemsLink: `//div[@class='dependants']/h6[contains(.,'Show dependent items')]`,
    hideDependentItemsLink: `//div[@class='dependants']/h6[contains(.,'Hide dependent items')]`,
    addScheduleButton: `//button[contains(@id,'ActionButton') and child::span[contains(.,'Add schedule')]]`,
    removeItemIcon: `//div[contains(@class,'icon remove')]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    contentSummaryByDisplayName:
        displayName => `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    itemToPublish:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    contentStatus:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,
};

class ContentPublishDialog extends Page {

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get showDependentItemsLink() {
        return XPATH.container + XPATH.showDependentItemsLink;
    }

    get hideDependentItemsLink() {
        return XPATH.container + XPATH.hideDependentItemsLink;
    }

    get logMessageLink() {
        return XPATH.container + XPATH.logMessageLink;
    }

    get publishNowButton() {
        return XPATH.container + XPATH.publishNowButton;
    }

    get addScheduleButton() {
        return XPATH.container + XPATH.addScheduleButton;
    }

    get includeChildrenToogler() {
        return XPATH.container + XPATH.includeChildrenToogler;
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.publishNowButton, appConst.TIMEOUT_2);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_10).catch(err => {
            this.saveScreenshot('err_close_publish_dialog');
            throw new Error('Publish dialog must be closed ' + err);
        })
    }

    clickOnPublishNowButton() {
        return this.clickOnElement(this.publishNowButton).catch(err => {
            this.saveScreenshot('err_click_on_publish_button_publish_dialog');
            throw new Error('Error when clicking Publish Now button ' + err);
        })
    }

    isIncludeChildTogglerDisplayed() {
        return this.isElementDisplayed(this.includeChildrenToogler);
    }

    clickOnScheduleButton() {
        return this.clickOnElement(this.addScheduleButton).catch(err => {
            this.saveScreenshot('err_publish_dialog_add_schedule_button');
            throw new Error('Error when clicking Publish  ' + err);
        })
    }

    clickOnShowDependentItems() {
        return this.clickOnElement(this.showDependentItemsLink).catch(err => {
            this.saveScreenshot('err_publish_dialog_show_dependent_button');
            throw new Error('Error when clicking on Show dependent items  ' + err);
        })
    }

    clickOnIncludeChildrenToogler() {
        return this.clickOnElement(this.includeChildrenToogler).catch(err => {
            throw new Error('Error when clicking on Include Children toggler ' + err);
        })
    }

    waitForShowDependentButtonDisplayed() {
        return this.waitForElementDisplayed(this.showDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
            throw new Error("Show dependent items link should be visible!" + err)
        })
    }

    waitForHideDependentItemsDisplayed() {
        return this.waitForElementDisplayed(this.hideDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
            throw new Error("Hide dependent items link should be visible!" + err)
        })
    }

    getContentStatus(name) {
        let selector = XPATH.contentStatus(name);
        return this.getText(selector);
    }

    async getWorkflowState(displayName) {
        let xpath = XPATH.contentSummaryByDisplayName(displayName);
        await this.waitForElementDisplayed(xpath, appConst.TIMEOUT_2);
        let result = await this.getAttribute(xpath, 'class');
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

    isAddScheduleButtonDisplayed() {
        return this.waitForElementDisplayed(this.addScheduleButton, appConst.TIMEOUT_2).catch(err => {
            throw new Error("`Add Schedule` button is not present " + err);
        })
    }

    isLogMessageLinkDisplayed() {
        return this.isElementDisplayed(this.logMessageLink, appConst.TIMEOUT_2);
    }

    async waitForPublishNowButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.publishNowButton, appConst.TIMEOUT_2);
        } catch (err) {
            this.saveScreenshot("publish_now_disabled");
            throw new Error("Publish Wizard - Publish Now button should be enabled " + err);
        }
    }

    waitForPublishNowButtonDisabled() {
        return this.waitForElementDisabled(this.publishNowButton, appConst.TIMEOUT_2);
    }

    async isPublishItemRemovable(displayName) {
        let selector = XPATH.itemToPublish(displayName);
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        let attr = await this.getAttribute(selector, "class");
        return attr.includes("removable");
    }

    clickOnCancelTopButton() {
        return this.clickOnElement(this.cancelButtonTop);
    }

    async getNumberItemsToPublish() {
        let selector = XPATH.container + `//button[contains(@id,'DialogButton')]/span[contains(.,'Publish Now')]`;
        let number = await this.getText(selector);
        let startIndex = number.indexOf('(');
        if (startIndex == -1) {
            throw new Error("Content Publish Dialog - error when get a number in  `Publish now` button  ");
        }
        let endIndex = number.indexOf(')');
        if (endIndex == -1) {
            throw new Error("Content Publish Dialog - error when get a number in  `Publish now` button ");
        }
        return number.substring(startIndex + 1, endIndex);
    }

    async removeDependentItem(displayName) {
        let selector = XPATH.itemToPublish(displayName) + XPATH.removeItemIcon;
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        await this.clickOnElement(selector);
        return await this.pause(300);
    }

    async getItemsToPublish() {
        let selector = XPATH.container + XPATH.publishItemList + lib.H6_DISPLAY_NAME;
        let result = await this.getTextInDisplayedElements(selector);
        return [].concat(result);
    }

    async clickOnItemToPublishAndSwitchToWizard(displayName) {
        let selector = XPATH.publishItemList + XPATH.itemToPublish(displayName);
        await this.clickOnElement(selector);
        return await this.getBrowser().switchWindow(displayName);
    }
};
module.exports = ContentPublishDialog;
