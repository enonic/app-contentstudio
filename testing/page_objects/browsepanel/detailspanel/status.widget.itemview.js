/**
 * Created on 11.02.2022
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'StatusWidgetItemView')]`,
};

class StatusWidgetItemView extends Page {

    get statusLocator() {
        return xpath.container + "/span";
    }

    async waitForStatusDisplayed(status) {
        try {
            let locator = xpath.container + `/span[text()='${status}']`
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName("err_content_status");
            throw new Error('Error when waiting for the status ' + screenshot + ' ' + err);
        }
    }
}

module.exports = StatusWidgetItemView;


