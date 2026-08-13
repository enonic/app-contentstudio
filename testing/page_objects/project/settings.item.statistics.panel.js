/**
 * Created on 02/04/2020.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'SettingsItemStatisticsPanel')]",
    settingsItemStatistics: "//div[@data-component='SettingsItemStatistics']",
    projectStatistics: "//div[@data-component='ProjectStatistics']",
    folderStatistics: "//div[@data-component='FolderStatistics']",
    itemHeader: "//header[@data-component='ItemHeader']",
    headerSubtitle: "//header[@data-component='ItemHeader']//span[contains(@class,'text-subtle')]",
    statisticsColumnByHeader: (header) => `//div[@data-component='StatisticsColumn' and child::dt[text()='${header}']]`,
    svgDiv: "//div[contains(@id,'ProjectDAGVisualization')]//div[contains(@id,'svg-container')]",
};

class SettingsItemStatisticsPanel extends Page {
    get description() {
        return XPATH.container + XPATH.headerSubtitle;
    }

    async waitForGraphicElementDisplayed(title) {
        try {
            let locator = XPATH.svgDiv + `//*[contains(@id,'txt-dn') and text()='${title}']`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Graphic element for '${title}' should be displayed in statistics panel`,
                'err_graphic_element',
                err,
            );
        }
    }

    async getDescription() {
        try {
            await this.waitForDescriptionDisplayed();
            return await this.getText(this.description);
        } catch (err) {
            await this.handleError('Get the description in statistics panel', 'err_get_project_description', err);
        }
    }

    // Returns the display name of a project item (the first span in h2, without the '(id)' part)
    async getItemDisplayName() {
        try {
            await this.waitForProjectStatisticsDisplayed();
            let locator = XPATH.container + XPATH.projectStatistics + XPATH.itemHeader + '//h2//span/span[1]';
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Get the display name in statistics panel', 'err_get_project_display_name', err);
        }
    }

    async getFolderDisplayName() {
        try {
            let locator = XPATH.container + XPATH.folderStatistics + XPATH.itemHeader + '//h2';
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(
                'Get the folder display name in statistics panel',
                'err_get_folder_display_name',
                err,
            );
        }
    }

    async waitForDescriptionDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.description, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                "Project's description should be displayed",
                'err_description_should_be_displayed',
                err,
            );
        }
    }

    async waitForProjectStatisticsDisplayed() {
        try {
            return await this.waitForElementDisplayed(
                XPATH.container + XPATH.projectStatistics,
                appConst.mediumTimeout,
            );
        } catch (err) {
            await this.handleError(
                'Statistics Panel - project statistics should be displayed',
                'err_project_statistics',
                err,
            );
        }
    }

    async waitForDescriptionNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.description, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                "Project's description should not be displayed",
                'err_description_should_not_be_displayed',
                err,
            );
        }
    }

    async getLanguage() {
        let locator = XPATH.container + XPATH.statisticsColumnByHeader('Language') + '//dd';
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getAccessMode() {
        let locator = XPATH.container + XPATH.statisticsColumnByHeader('Access Mode') + '//dd';
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    // Returns display names of principals in the 'Contributors' column (Roles block)
    async getContributors() {
        try {
            let locator =
                XPATH.container +
                XPATH.statisticsColumnByHeader('Contributors') +
                "//li//span[contains(@class,'font-semibold')]";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Get contributors in statistics panel', 'err_get_contributors', err);
        }
    }
}

module.exports = SettingsItemStatisticsPanel;
