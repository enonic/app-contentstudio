/**
 * Created on 02/04/2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'SettingsItemStatisticsPanel')]",
    descriptionBlock: "//div[contains(@id,'DescriptionBlock')]",
    projectStatisticsViewer: "//div[contains(@id,'ProjectStatisticsViewer')]",
    folderStatisticsViewer: "//div[contains(@id,'FolderStatisticsViewer')]",
    projectMetaStatisticsDiv: "//div[contains(@id,'ProjectMetaStatisticsBlock')]",
    projectRolesStatisticsBlockDiv: "//div[contains(@id,'ProjectRolesStatisticsBlock')]",
};

class SettingsItemStatisticsPanel extends Page {

    get description() {
        return XPATH.container + XPATH.descriptionBlock;
    }

    async getDescription() {
        try {
            await this.waitForDescriptionDisplayed();
            return await this.getText(this.description + "/div[@class='text']");
        } catch (err) {
            this.saveScreenshot('err_get_project_description');
            throw new Error('error when getting the description in statistics panel' + err);
        }
    }

    async getItemDisplayName() {
        try {
            await this.waitForProjectStatisticsViewerDisplayed();
            return await this.getText(XPATH.container + XPATH.projectStatisticsViewer + lib.H6_DISPLAY_NAME);
        } catch (err) {
            this.saveScreenshot('err_get_project_display_name');
            throw new Error('error when getting the display name in statistics panel ' + err);
        }
    }

    async getFolderDisplayName() {
        try {
            await this.waitForElementDisplayed(XPATH.container + XPATH.folderStatisticsViewer, appConst.mediumTimeout);
            return await this.getText(XPATH.container + XPATH.folderStatisticsViewer + lib.H6_DISPLAY_NAME);
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

    async waitForProjectStatisticsViewerDisplayed() {
        try {
            return await this.waitForElementDisplayed(XPATH.container + XPATH.projectStatisticsViewer, appConst.mediumTimeout);
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

    async getLanguage() {
        let locator = "//div[contains(@id,'StatisticsBlockColumn') and child::h6[text()='Language']]//div";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getAccessMode() {
        let locator = "//div[contains(@id,'StatisticsBlockColumn') and child::h6[text()='Access Mode']]//div";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getContributors() {
        try {
            let locator = XPATH.container + XPATH.projectRolesStatisticsBlockDiv +
                          "//div[contains(@id,'StatisticsBlockColumn') and child::h6[text()='Contributors']]" + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("settings_st_panel"));
            throw new Error("Settings item statistics panel: " + err);
        }

    }
}

module.exports = SettingsItemStatisticsPanel;
