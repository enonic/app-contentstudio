/**
 * Created on 23/04/2020.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements-old');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'ContentWidgetItemView')]`,
    contentSummary: "//div[contains(@id,'ContentSummaryAndCompareStatusViewer')]",
    languageProperty: `//dd[contains(.,'Language:')]/following-sibling::dt[1]`,
    workInProgressIcon: "//div[@class='xp-admin-common-wrapper' and @title='Work in progress']"
};

class ContentWidgetItemView extends Page {

    async getContentName() {
        let selector = xpath.container + xpath.contentSummary + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getText(selector);
    }

    async getContentWorkflowState() {
        let selector = xpath.container + xpath.contentSummary;
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
            return await this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Widget Item should not be displayed', 'err_widget_item_is_visible', err);
        }
    }

    async waitForWorkInProgressIconNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(xpath.workInProgressIcon, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Workflow state should not be displayed in the widget item', 'err_widget_item_workflow', err);
        }
    }
}
module.exports = ContentWidgetItemView;
