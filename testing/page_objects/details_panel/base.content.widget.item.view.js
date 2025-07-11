/**
 * Created on 10.07.2025
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'ContentWidgetItemView')]`,
    contentSummary: "//div[contains(@id,'ContentSummaryAndCompareStatusViewer')]",
    languageProperty: `//dd[contains(.,'Language:')]/following-sibling::dt[1]`,
    workInProgressIcon: "//div[@class='xp-admin-common-wrapper' and @title='Work in progress']"
};

class BaseContentWidgetItemView extends Page {

    get container(){
        return this.parentPanel + xpath.container;
    }
    async getContentName() {
        let selector = this.container  + xpath.contentSummary + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getText(selector);
    }

    async getContentWorkflowState() {
        let selector = this.container  + xpath.contentSummary;
        let atrClass = await this.getAttribute(selector, 'class');
        if (atrClass.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (atrClass.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        }
    }

    isDisplayed() {
        return this.isElementDisplayed(xpath.container);
    }

    async waitForNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.container, appConst.shortTimeout);
        } catch (err) {
            this.saveScreenshot('err_widget_item_is_visible');
            throw new Error("Widget Item should not be displayed " + err);
        }
    }

    async waitForWorkInProgressIconNotDisplayed() {
        try {
            let locator = this.container + xpath.workInProgressIcon;
            return await this.waitForElementNotDisplayed( locator, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot("err_widget_item_workflow");
            throw new Error("Workflow state should not be displayed in the widget item " + err);
        }
    }

    async isContentInvalid() {
        let selector = this.container + lib.CONTENT_SUMMARY_AND_STATUS_VIEWER;
        let attr = await this.getAttribute(selector, 'class');
        return await attr.includes('invalid');
    }
}

module.exports = BaseContentWidgetItemView;
