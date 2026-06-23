/**
 * Created on 5/03/2020.
 */
const {BUTTONS, TREE_GRID} = require('../../libs/elements');
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
    toolbarDiv: `//div[@data-component='Toolbar.Container'  and @aria-label='Project settings menu bar']`,
    itemsTreeGrid: `//div[contains(@id,'SettingsItemsTreeGrid')]`,
    settingsTreeListDataComponent: `//div[@data-component='SettingsTreeList']`,
    listBoxToolbarDiv: `//div[contains(@id,'ListBoxToolbar')]`,
    listSelectionControllerDiv: `//div[contains(@id,'ListSelectionController')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,

    projectItemByDisplayName: displayName =>
        `//div[@data-component='VirtualizedTreeList.Row' and descendant::div[@data-component='ProjectLabel']//span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`,

    projectsFolderRow:
        `//div[@data-component='VirtualizedTreeList.Row' and descendant::div[@data-component='ItemLabel']//span[contains(@class,'font-semibold') and text()='Projects']]`,

    projectCheckboxByName: name =>
        `//div[@data-component='VirtualizedTreeList.Row' and descendant::div[@data-component='ProjectLabel']//span[contains(@class,'font-semibold') and contains(.,'${name}')]]` +
        `//div[@data-component='VirtualizedTreeList.RowSelectionControl']`,

    projectCheckboxByIdentifier: id => {
        return `//div[contains(@id,'ProjectItemViewer') and descendant::p[contains(@class,'sub-name') and contains(.,'${id}')]]/..//..//div[contains(@id,'Checkbox')]/label`
    },

    expanderIconByName: name => `${lib.PROJECTS.projectByName(name)}/..//div[contains(@class,'toggle icon-arrow_drop_up')]`,

    tabCloseIcon: projectDisplayName => XPATH.appBarTabMenu +
                                        `//li[contains(@id,'AppBarTabMenuItem') and descendant::a[contains(.,'${projectDisplayName}')]]/button`
}

class SettingsBrowsePanel extends BaseBrowsePanel {

    get toolbar() {
        return XPATH.container + XPATH.toolbarDiv;
    }

    get deleteButton() {
        return XPATH.toolbarDiv + BUTTONS.buttonAriaLabel('Delete');
    }

    get homeButton() {
        return XPATH.appBar + XPATH.homeButton;
    }

    get newButton() {
        return XPATH.toolbarDiv + BUTTONS.buttonAriaLabel('New');
    }

    get editButton() {
        return XPATH.toolbarDiv + BUTTONS.buttonAriaLabel('Edit');
    }

    get syncButton() {
        return XPATH.toolbarDiv + BUTTONS.buttonAriaLabel('Sync');
    }

    get treeGrid() {
        return XPATH.container + XPATH.settingsTreeListDataComponent;
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
        return XPATH.settingsTreeListDataComponent + lib.H6_DISPLAY_NAME;
    }

    // returns array with displayName of all items in the Settings Browse Panel
    getDisplayNames() {
        let selector = this.treeGrid + lib.H6_DISPLAY_NAME + "/span[@class='display-name']";
        return this.getTextInElements(selector);
    }

    async clickOnExpanderIcon(name) {
        try {
            let expanderIcon = XPATH.settingsTreeListDataComponent +
                               TREE_GRID.itemByDisplayName(name) +
                               `//button[@data-component='VirtualizedTreeList.RowExpandControl']`;
            await this.waitForElementDisplayed(expanderIcon, appConst.mediumTimeout);
            await this.clickOnElement(expanderIcon);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Error occurred after clicking on expander-icon: ${name}`, 'err_click_on_expander', err);
        }
    }

    async waitForItemDisplayed(projectName) {
        try {
            let nameXpath = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(projectName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Project is not displayed: ${projectName}`, 'err_browse_panel', err);
        }
    }

    async waitForItemByDisplayNameDisplayed(displayName) {
        try {
            let selector = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(selector, appConst.longTimeout);
        } catch (err) {
            await this.handleError(`Settings: project item with the display name was not found: ${displayName}`, 'err_find_item', err);
        }
    }

    async waitForLanguageIconDisplayed(displayName) {
        try {
            let locatorIcon = XPATH.settingsTreeListDataComponent + lib.PROJECTS.projectByName(displayName) + "//div[contains(@id,'Flag')]";
            await this.waitForElementDisplayed(locatorIcon, appConst.longTimeout);
            return await this.getAttribute(locatorIcon, 'data-code');
        } catch (err) {
            await this.handleError(`Settings: language icon was not found for: ${displayName}`, 'err_language_icon', err);
        }
    }

    async waitForProjectNotDisplayed(projectDisplayName) {
        try {
            let locator = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(projectDisplayName);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Project is still displayed: ${projectDisplayName}`, 'err_project_not_displayed', err);
        }
    }

    //Click on SETTINGS button:
    async clickOnHomeButton() {
        await this.waitForElementDisplayed(this.homeButton);
        return await this.clickOnElement(this.homeButton);
    }

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath);
            await this.clickOnElement(nameXpath);
        } catch (err) {
            await this.handleError(`Error occurred after clicking on the row with display name: ${displayName}`, 'err_click_row', err);
        }
    }

    async waitForProjectByIdDisplayed(id) {
        try {
            let nameXpath = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByName(id);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Row with the id is not displayed: ${id}`, 'err_find_item', err);
        }
    }

    async waitForProjectByDisplayNameDisplayed(displayName) {
        try {
            let nameXpath = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Project is not visible: ${displayName}`, 'err_find_project', err);
        }
    }

    async clickOnCheckboxAndSelectRowByName(name) {
        try {
            let nameXpath = XPATH.projectCheckboxByName(name);
            await this.waitUntilDisplayed(nameXpath, appConst.mediumTimeout);
            let checkboxElement = await this.getDisplayedElements(nameXpath);
            await checkboxElement[0].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Project's checkbox was not found: ${name}`, 'err_checkbox_proj', err);
        }
    }

    async clickOnProjectsFolderCheckbox() {
        try {
            let locator = XPATH.settingsTreeListDataComponent + XPATH.projectsFolderRow +
                          `//div[@data-component='VirtualizedTreeList.RowSelectionControl']`;
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Error occurred after clicking on Projects folder checkbox', 'err_projects_folder_checkbox', err);
        }
    }

    async clickOnCheckboxAndSelectRowByIdentifier(id) {
        try {
            let nameXpath = XPATH.projectCheckboxByIdentifier(id);
            await this.waitForElementDisplayed(nameXpath, appConst.shortTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Project's checkbox was not found for id: ${id}`, 'err_checkbox_proj', err);
        }
    }

    isExpanderIconPresent(name) {
        let expanderIcon = XPATH.settingsTreeListDataComponent + XPATH.expanderIconByName(name);
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
            const nameXpath = XPATH.settingsTreeListDataComponent + XPATH.projectsFolderRow;
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            await this.handleError('Error occurred after right click on Projects row', 'err_rightClick_projects', err);
        }
    }

    async rightClickOnProjectItemByDisplayName(displayName) {
        try {
            const nameXpath = XPATH.settingsTreeListDataComponent + XPATH.projectItemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            await this.handleError(`Error when right clicking on project row: ${displayName}`, 'err_rightClick', err);
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

    // Looks up a project row by its identifier (the <small> sub-name) and returns the bold display name
    // without the trailing language suffix (e.g. ' (en)') that the renderer appends as a nested span.
    async getProjectDisplayName(name) {
        const rowLocator = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByName(name);
        const displayNameLocator = rowLocator + TREE_GRID.PROJECT_LABEL_DISPLAY_NAME_SPAN;
        const languageSuffixLocator = rowLocator + TREE_GRID.PROJECT_LABEL_LANGUAGE_SUFFIX_SPAN;
        await this.waitForElementDisplayed(displayNameLocator, appConst.mediumTimeout);
        const fullText = await this.getText(displayNameLocator);
        // Strip the ' (xx)' language suffix span text if present, so we return just the bare display name.
        const suffixElements = await this.findElements(languageSuffixLocator);
        if (suffixElements.length > 0) {
            const suffix = await suffixElements[0].getText();
            if (suffix && fullText.endsWith(suffix)) {
                return fullText.substring(0, fullText.length - suffix.length).trim();
            }
        }
        return fullText.trim();
    }

    // Looks up a project row by its display name and returns the identifier shown in <small>.
    async getProjectIdentifier(displayName) {
        const identifierLocator = XPATH.settingsTreeListDataComponent +
                                  TREE_GRID.itemByDisplayName(displayName) +
                                  TREE_GRID.PROJECT_LABEL_IDENTIFIER_SMALL;
        await this.waitForElementDisplayed(identifierLocator, appConst.mediumTimeout);
        return await this.getText(identifierLocator);
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

    async waitForSyncButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.syncButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Sync button should be enabled', 'err_sync_disabled_button', err);
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
            await this.handleError(`Error occurred after clicking on 'Delete' button`, 'err_browsepanel_delete_button', err);
        }
    }

    async waitForDeleteButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Delete button is not disabled', 'err_delete_button', err);
        }
    }

    async waitForDeleteButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Delete button is not enabled', 'err_delete_button', err);
        }
    }
}

module.exports = SettingsBrowsePanel;
