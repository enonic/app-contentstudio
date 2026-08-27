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
    // The description is the span right after 'h2'. Matching by 'text-subtle' alone is wrong:
    // the identifier inside 'h2' carries the same class:
    headerSubtitle: "//header[@data-component='ItemHeader']//h2/following-sibling::span",
    statisticsColumnByHeader: (header) => `//div[@data-component='StatisticsColumn' and child::dt[text()='${header}']]`,
    // 'Projects graph' - displayed for the 'Projects' folder only:
    projectsGraph: "//div[@data-component='ProjectDag']",
    projectsGraphViewport: "//div[@aria-label='Projects graph']",
    projectsGraphEdges: "//*[name()='svg' and @data-component='ProjectDagEdges']",
    projectsGraphControls: "//div[@data-component='ProjectDagControls']",
    // A card of the graph. Its aria-label is 'displayName (id)', so the display name is taken
    // from the first span and the identifier (with the language) from the second one:
    graphCard: "//button[@data-component='ProjectDagCard']",
    graphCardByDisplayName: (displayName) =>
        `//button[@data-component='ProjectDagCard' and descendant::span[text()='${displayName}']]`,
    graphCardDisplayName: "//span[contains(@class,'font-semibold')]",
    graphCardId: "//span[contains(@class,'text-subtle')]",
    // Current zoom of the graph, in percents:
    graphZoomValue: "//span[contains(@class,'tabular-nums')]",
};

class SettingsItemStatisticsPanel extends Page {
    get description() {
        return XPATH.container + XPATH.headerSubtitle;
    }

    get projectsGraph() {
        return XPATH.container + XPATH.projectsGraph;
    }

    // Card of a project in the 'Projects graph', 'title' is the display name of the project:
    graphicElementByDisplayName(title) {
        return this.projectsGraph + XPATH.graphCardByDisplayName(title);
    }

    async waitForProjectsGraphDisplayed() {
        try {
            await this.waitForElementDisplayed(this.projectsGraph);
            // the graph is rendered when the projects are loaded, the skeleton is replaced with the viewport:
            await this.waitForElementDisplayed(
                this.projectsGraph + XPATH.projectsGraphViewport,
                appConst.mediumTimeout,
            );
        } catch (err) {
            await this.handleError(
                `'Projects graph' should be displayed in statistics panel`,
                'err_projects_graph',
                err,
            );
        }
    }

    async waitForProjectsGraphNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.projectsGraph);
        } catch (err) {
            await this.handleError(
                `'Projects graph' should not be displayed in statistics panel`,
                'err_projects_graph',
                err,
            );
        }
    }

    async waitForGraphicElementDisplayed(title) {
        try {
            await this.waitForElementDisplayed(this.graphicElementByDisplayName(title));
        } catch (err) {
            await this.handleError(
                `Graphic element for '${title}' should be displayed in statistics panel`,
                'err_graphic_element',
                err,
            );
        }
    }

    async waitForGraphicElementNotDisplayed(title) {
        try {
            await this.waitForElementNotDisplayed(this.graphicElementByDisplayName(title));
        } catch (err) {
            await this.handleError(
                `Graphic element for '${title}' should not be displayed in statistics panel`,
                'err_graphic_element',
                err,
            );
        }
    }

    // Display names of all projects in the graph:
    async getGraphicElementsDisplayNames() {
        try {
            await this.waitForProjectsGraphDisplayed();
            let locator = this.projectsGraph + XPATH.graphCard + XPATH.graphCardDisplayName;
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Getting display names in the Projects graph', 'err_get_graphic_elements', err);
        }
    }

    // Identifier of the project in the card - 'default' or 'my-layer (en)' when a language is set:
    async getGraphicElementId(title) {
        try {
            let locator = this.graphicElementByDisplayName(title) + XPATH.graphCardId;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(
                `Getting the identifier of '${title}' in the Projects graph`,
                'err_get_graphic_element_id',
                err,
            );
        }
    }

    async countGraphicElements() {
        await this.waitForProjectsGraphDisplayed();
        let elements = await this.findElements(this.projectsGraph + XPATH.graphCard);
        return elements.length;
    }

    // Number of connections between the projects in the graph (a layer adds one connection):
    async countGraphicElementConnections() {
        await this.waitForProjectsGraphDisplayed();
        let locator = this.projectsGraph + XPATH.projectsGraphEdges + "//*[name()='path']";
        let elements = await this.findElements(locator);
        return elements.length;
    }

    // Clicking on a card selects the project in Settings browse panel:
    async clickOnGraphicElement(title) {
        try {
            let locator = this.graphicElementByDisplayName(title);
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Clicked on the graphic element for '${title}' in statistics panel`,
                'err_click_on_graphic_element',
                err,
            );
        }
    }

    // Current zoom of the graph, e.g. '100%':
    async getProjectsGraphZoomValue() {
        try {
            let locator = this.projectsGraph + XPATH.projectsGraphControls + XPATH.graphZoomValue;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Getting the zoom value in the Projects graph', 'err_graph_zoom_value', err);
        }
    }

    // 'Zoom in', 'Zoom out', 'Fit to view' or 'Reset zoom' button in the bottom right corner of the graph:
    async clickOnGraphControlButton(label) {
        try {
            let locator = this.projectsGraph + XPATH.projectsGraphControls + `//button[@aria-label='${label}']`;
            await this.waitForElementDisplayed(locator);
            await this.waitForElementEnabled(locator);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                `Clicked on '${label}' button in the Projects graph`,
                'err_click_on_graph_control',
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
            await this.waitForElementDisplayed(locator);
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
            return await this.waitForElementDisplayed(this.description);
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
            return await this.waitForElementNotDisplayed(this.description);
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
            await this.waitForElementDisplayed(locator);
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Get contributors in statistics panel', 'err_get_contributors', err);
        }
    }
}

module.exports = SettingsItemStatisticsPanel;
