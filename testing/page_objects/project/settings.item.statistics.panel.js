/**
 * Created on 02/04/2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'SettingsItemStatisticsPanel')]",
    descriptionBlock: "//div[contains(@id,'DescriptionBlock')]",
    header: "//div[contains(@id,'ItemStatisticsHeader')]"
}

class SettingsItemStatisticsPanel extends Page {

    get description() {
        return XPATH.container + XPATH.descriptionBlock;
    }

    async getDescription() {
        try {
            await this.waitForDescriptionDisplayed()
            return await this.getText(this.description + "/div[@class='text']");
        } catch (err) {
            this.saveScreenshot('err_get_project_description');
            throw new Error('error when getting the description in statistics panel' + err);
        }
    }

    async getItemDisplayName() {
        try {
            await this.waitForHeaderDisplayed()
            return await this.getText(XPATH.container + XPATH.header + "//h1[@class='title']");
        } catch (err) {
            this.saveScreenshot('err_get_project_display_name');
            throw new Error('error when getting the display name in statistics panel ' + err);
        }
    }

    async waitForDescriptionDisplayed() {
        try {
            return await this.waitForElementDisplayed(XPATH.container + XPATH.descriptionBlock, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_description_block_should_be_displayed');
            throw new Error("Project's description is not displayed ! " + err);
        }
    }

    async waitForHeaderDisplayed() {
        try {
            return await this.waitForElementDisplayed(XPATH.container + XPATH.header, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_header_should_be_displayed');
            throw new Error("Statistics Panel - Project's display name is not displayed ! " + err);
        }
    }

    async waitForDescriptionNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container + XPATH.descriptionBlock, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot('err_description_block_should_not_be_displayed');
            throw new Error("Project's description should not be displayed ! " + err);
        }
    }
};
module.exports = SettingsItemStatisticsPanel;
