/**
 * Created on 5/03/2020.
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BaseBrowsePanel = require('../../page_objects/base.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ProjectWizardDialogParentProjectStep = require('./project-wizard-dialog/project.wizard.parent.project.step');

const XPATH = {
    container: "//div[contains(@id,'SettingsBrowsePanel')]",
    settingsAppContainer: "//div[contains(@id,'ContentAppBar')]",
    appBar: "//div[contains(@id,'ContentAppBar')]",
    appBarTabMenu: "//div[contains(@id,'AppBarTabMenu')]",
    homeButton: "//div[contains(@class,'home-button') and descendant::span[text()='Settings']]",
    toolbarDiv: `//div[contains(@id,'SettingsBrowseToolbar')]`,
    itemsTreeGrid: `//div[contains(@id,'SettingsItemsTreeGrid')]`,
    settingsTreeList: `//ul[contains(@id,'SettingsTreeList')]`,
    listBoxToolbarDiv: `//div[contains(@id,'ListBoxToolbar')]`,
    listSelectionControllerDiv: `//div[contains(@id,'ListSelectionController')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    showIssuesButton: "//button[contains(@id,'ShowIssuesDialogButton')]//span",

    contextMenuItemByName: (name) => {
        return `${lib.TREE_GRID_CONTEXT_MENU}/li[contains(@id,'MenuItem') and contains(.,'${name}')]`;
    },
    projectItemByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,


    projectCheckboxByName: name => {
        return `//div[contains(@id,'ProjectItemViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]/..//..//div[contains(@id,'Checkbox')]/label`
    },

    projectCheckboxByIdentifier: id => {
        return `//div[contains(@id,'ProjectItemViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${id}')]]/..//..//div[contains(@id,'Checkbox')]/label`
    },

    expanderIconByName: name => `${lib.PROJECTS.projectByName(name)}/..//div[contains(@class,'toggle icon-arrow_drop_up')]`,

    tabCloseIcon: projectDisplayName => XPATH.appBarTabMenu +
                                        `//li[contains(@id,'AppBarTabMenuItem') and descendant::a[contains(.,'${projectDisplayName}')]]/button`
}

class SettingsBrowsePanel extends BaseBrowsePanel {

    get toolbar() {
        return XPATH.toolbar;
    }

    get deleteButton() {
        return XPATH.toolbarDiv + `/*[contains(@id, 'ActionButton') and child::span[text()='Delete']]`;
    }

    get homeButton() {
        return XPATH.appBar + XPATH.homeButton;
    }

    get newButton() {
        return XPATH.toolbarDiv + `/*[contains(@id, 'ActionButton') and child::span[text()='New...']]`;
    }

    get editButton() {
        return XPATH.toolbarDiv + `/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
    }

    get syncButton() {
        return XPATH.toolbarDiv + `/*[contains(@id, 'ActionButton') and child::span[text()='Sync']]`;
    }

    get treeGrid() {
        return XPATH.container + XPATH.settingsTreeList;
    }

    get browseToolbar() {
        return XPATH.container + XPATH.toolbarDiv;
    }

    get selectionControllerCheckBox() {
        return XPATH.container + XPATH.listBoxToolbarDiv + XPATH.listSelectionControllerDiv;
    }

    get selectionPanelToggler() {
        return `${XPATH.container}${XPATH.listBoxToolbarDiv}${lib.SELECTION_PANEL_TOGGLER}`;
    }

    get numberInToggler() {
        return XPATH.listBoxToolbarDiv + XPATH.numberInSelectionToggler;
    }

    get displayNames() {
        return XPATH.settingsTreeList + lib.H6_DISPLAY_NAME;
    }

    // returns array with displayName of all items in the Settings Browse Panel
    getDisplayNames() {
        let selector = this.treeGrid + lib.H6_DISPLAY_NAME + "/span[@class='display-name']";
        return this.getTextInElements(selector);
    }

    async clickOnExpanderIcon(name) {
        try {
            let expanderIcon = XPATH.settingsTreeList + XPATH.expanderIconByName(name);
            await this.clickOnElement(expanderIcon);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_expander');
            throw new Error(`Error occurred after clicking on expander-icon, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForItemDisplayed(projectName) {
        try {
            let locator = XPATH.settingsTreeList + XPATH.projectItemByDisplayName(projectName);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_browse_panel');
            throw new Error(`Project is not displayed ! Screenshot: ${screenshot} ` + err);
        }
    }

    async waitForItemByDisplayNameDisplayed(displayName) {
        try {
            let selector = XPATH.settingsTreeList + lib.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(selector, appConst.longTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_item');
            throw new Error('Settings: project item with the display name was not found ! Screenshot: ' + screenshot + "   " + err);
        }
    }

    async waitForLanguageIconDisplayed(displayName) {
        try {
            let locatorIcon = XPATH.settingsTreeList + lib.PROJECTS.projectNameAndIconViewDiv(displayName) + "//div[contains(@id,'Flag')]";
            await this.waitForElementDisplayed(locatorIcon, appConst.longTimeout);
            return await this.getAttribute(locatorIcon, 'data-code');
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_language_icon');
            throw new Error(`Settings: language icon was not found ! screenshot: ${screenshot} ` + err);
        }
    }

    async waitForProjectNotDisplayed(projectDisplayName) {
        try {
            let selector = XPATH.settingsTreeList + lib.itemByDisplayName(projectDisplayName);
            return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("projectName is still displayed : " + err);
        }
    }

    //Click on SETTINGS button:
    async clickOnHomeButton() {
        await this.waitForElementDisplayed(this.homeButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.homeButton);
    }

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.settingsTreeList + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_project');
            throw new Error('Project Browse Panel - project was not found ' + screenshot + '  ' + err);
        }
    }

    async waitForItemByNameVisible(name) {
        let nameXpath = XPATH.settingsTreeList + lib.itemByName(name);
        try {
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_item');
            throw Error(`Row with the name is not displayed! screenshot:${screenshot} ` + err);
        }
    }

    async waitForProjectByDisplayNameVisible(displayName) {
        try {
            let nameXpath = XPATH.settingsTreeList + lib.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_find_project');
            throw new Error(`Project is not visible, screenshot:${screenshot} ` + err);
        }
    }

    async clickOnCheckboxAndSelectRowByName(name) {
        try {
            let nameXpath = XPATH.projectCheckboxByName(name);
            await this.waitUntilDisplayed(nameXpath, appConst.mediumTimeout);
            let checkboxElement = await this.getDisplayedElements(nameXpath);
            //await this.clickOnElement(nameXpath);
            await checkboxElement[0].click()
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_checkbox_proj');
            throw new Error(`Project's checkbox was not found Screenshot:${screenshot} ` + err);
        }
    }

    async clickOnProjectsFolderCheckbox() {
        let locator = `//div[contains(@id,'FolderItemViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'Projects')]]/..//..//div[contains(@id,'Checkbox')]/label`;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        await this.clickOnElement(locator);
    }

    async clickOnCheckboxAndSelectRowByIdentifier(id) {
        try {
            let nameXpath = XPATH.projectCheckboxByIdentifier(id);
            await this.waitForElementDisplayed(nameXpath, appConst.shortTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_checkbox_proj');
            throw new Error(`Project's checkbox was not found Screenshot:${screenshot} ` + err);
        }
    }

    isExpanderIconPresent(name) {
        let expanderIcon = XPATH.settingsTreeList + XPATH.expanderIconByName(name);
        return this.waitForElementDisplayed(expanderIcon).catch(err => {
            this.saveScreenshot('expander_not_exists ' + name);
            return false;
        })
    }

    async openProjectWizardDialog() {
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        // 1.'New...' button has been clicked:
        await this.clickOnNewButton();
        // 2. 'Project Wizard Dialog' should be loaded:
        await parentProjectStep.waitForLoaded();
        return parentProjectStep;
    }

    async rightClickOnProjects() {
        try {
            const nameXpath = XPATH.container + XPATH.projectItemByDisplayName('Projects');
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_rightClick');
            throw new Error(`Error occurred after right click on the row:` + err);
        }
    }

    async rightClickOnProjectItemByDisplayName(displayName) {
        try {
            const nameXpath = XPATH.container + XPATH.projectItemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_rightClick');
            throw new Error(`Error when do right click on the row, screenshot:${screenshot}` + err);
        }
    }

    async openProjectByDisplayName(displayName) {
        let projectWizard = new ProjectWizard();
        // the root folder(Projects) should be expanded:
        // 1. click on the project:
        await this.clickOnRowByDisplayName(displayName);
        // 2. wait for Edit button gets enabled:
        await this.clickOnEditButton();
        // 3. wait for Project is loaded in the wizard page:
        return await projectWizard.waitForLoaded();
    }

    async checkAndOpenProjectByDisplayName(displayName) {
        let projectWizard = new ProjectWizard();
        // the root folder(Projects) should be expanded:
        // 1. check the project:
        await this.clickOnCheckboxAndSelectRowByName(displayName);
        // 2. wait for Edit button gets enabled:
        await this.clickOnEditButton();
        // 3. wait for Project is loaded:
        await projectWizard.waitForLoaded();
        return projectWizard;
    }

    getProjectDisplayName(name) {
        let selector = XPATH.projectItemByDisplayName(name) + "//span[@class='display-name']";
        return this.getText(selector)
    }

    getProjectIdentifier(displayName) {
        let selector = XPATH.projectItemByDisplayName(displayName) + "//p[contains(@class,'sub-name')]";
        return this.getText(selector)
    }

    async clickOnCloseIcon(displayName) {
        let selector = XPATH.tabCloseIcon(displayName);
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.clickOnElement(selector);
    }

    async getNumberOpenedTabItems() {
        let selector = XPATH.settingsAppContainer + "//li[contains(@id,'AppBarTabMenuItem')]";
        let result = await this.getDisplayedElements(selector);
        return result.length;
    }

    async getTextInShowIssuesButton() {
        await this.waitForElementDisplayed(XPATH.showIssuesButton, appConst.mediumTimeout);
        return await this.getText(XPATH.showIssuesButton);
    }

    async waitForSyncButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.syncButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_sync_disabled_button');
            throw new Error(`Sync button should be enabled, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnSyncButton() {
        await this.waitForSyncButtonEnabled();
        return await this.clickOnElement(this.syncButton);
    }

    async clickOnDeleteButton() {
        try {
            await this.waitForElementEnabled(this.deleteButton, appConst.shortTimeout);
            return await this.clickOnElement(this.deleteButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_browsepanel_delete_button');
            throw new Error(`Error occurred after clicking on 'Delete' button ! screenshot:  ${screenshot}  ` + err);
        }
    }

    async waitForDeleteButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_delete_button');
            throw Error(`Delete button is not disabled! screenshot:  ${screenshot} ` + err);
        }
    }

    async waitForDeleteButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_delete_button');
            throw Error(`Delete button is not enabled! screenshot:  ${screenshot} ` + err);
        }
    }
}

module.exports = SettingsBrowsePanel;
