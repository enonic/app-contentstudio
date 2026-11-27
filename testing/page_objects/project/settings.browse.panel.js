/**
 * Created on 5/03/2020.
 */
const { BUTTONS, TREE_GRID, COMMON } = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BaseBrowsePanel = require('../../page_objects/base.browse.panel');
const ProjectWizardDialogParentProjectStep = require('./project-wizard-dialog/project.wizard.parent.project.step');

const XPATH = {
    container: "//div[@data-component='SettingsBrowsePanel']",
    toolbarDiv: `//div[@data-component='Toolbar.Container'  and @aria-label='Project settings menu bar']`,
    settingsTreeListDataComponent: `//div[@data-component='SettingsTreeList']`,
    treeListToolbarDiv: `//div[@data-component='SettingsTreeListToolbar']`,

    projectItemByDisplayName: (displayName) =>
        `//div[@data-component='VirtualizedTreeList.Row' and descendant::div[@data-component='ProjectLabel']//span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`,

    projectsFolderRow: `//div[@data-component='VirtualizedTreeList.Row' and descendant::div[@data-component='ItemLabel']//span[contains(@class,'font-semibold') and text()='Projects']]`,

    rowExpandControl: `//button[@data-component='VirtualizedTreeList.RowExpandControl']`,
    rowSelectionControl: `//div[@data-component='VirtualizedTreeList.RowSelectionControl']`,

    projectCheckboxByName: (name) =>
        `//div[@data-component='VirtualizedTreeList.Row' and descendant::div[@data-component='ProjectLabel']//span[contains(@class,'font-semibold') and contains(.,'${name}')]]` +
        `//div[@data-component='VirtualizedTreeList.RowSelectionControl']`,
};

class SettingsBrowsePanel extends BaseBrowsePanel {
    get toolbar() {
        return XPATH.container + XPATH.toolbarDiv;
    }

    get deleteButton() {
        return this.toolbar + BUTTONS.buttonAriaLabel('Delete');
    }

    get newButton() {
        return this.toolbar + BUTTONS.buttonAriaLabel('New');
    }

    get editButton() {
        return this.toolbar + BUTTONS.buttonAriaLabel('Edit');
    }

    get syncButton() {
        return this.toolbar + BUTTONS.buttonAriaLabel('Sync');
    }

    get treeGrid() {
        return XPATH.container + XPATH.settingsTreeListDataComponent;
    }

    // Alias of 'toolbar', it is used in BaseBrowsePanel:
    get browseToolbar() {
        return this.toolbar;
    }

    get selectAllCheckboxLabel() {
        return XPATH.treeListToolbarDiv + COMMON.SELECT_ALL_CHECKBOX_LABEL;
    }

    // 'Select all' checkbox turns into 'Clear selection (N)' when rows are selected in the tree list:
    get clearSelectionCheckboxLabel() {
        return XPATH.treeListToolbarDiv + COMMON.CLEAR_SELECTION_CHECKBOX_LABEL;
    }

    // Bold display-name spans of all rows in the tree list ('Projects' folder, projects and layers).
    // Note: the returned text includes the language suffix when present, e.g. 'Features (en)'.
    get displayNames() {
        return (
            XPATH.settingsTreeListDataComponent +
            `//div[@data-component='TreeList.RowContent']//span[contains(@class,'font-semibold')]`
        );
    }

    expanderIconByDisplayName(displayName) {
        return XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(displayName) + XPATH.rowExpandControl;
    }

    async clickOnExpanderIcon(name) {
        try {
            let expanderIcon = this.expanderIconByDisplayName(name);
            await this.waitForElementDisplayed(expanderIcon, appConst.mediumTimeout);
            await this.clickOnElement(expanderIcon);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Tried to click on the expander icon in the row: ${name}`,
                'err_click_on_expander',
                err,
            );
        }
    }

    async waitForItemDisplayed(projectName) {
        try {
            let nameXpath = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(projectName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Project should be displayed: ${projectName}`, 'err_project_not_displayed', err);
        }
    }

    async waitForProjectNotDisplayed(projectDisplayName) {
        try {
            let locator = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(projectDisplayName);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Project should not be displayed: ${projectDisplayName}`,
                'err_project_still_displayed',
                err,
            );
        }
    }

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath);
            await this.clickOnElement(nameXpath);
        } catch (err) {
            await this.handleError(`Tried to click on the row with display name: ${displayName}`, 'err_click_row', err);
        }
    }

    async waitForProjectByIdDisplayed(id) {
        try {
            let nameXpath = XPATH.settingsTreeListDataComponent + TREE_GRID.itemByName(id);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Project with the identifier should be displayed: ${id}`,
                'err_project_id_not_displayed',
                err,
            );
        }
    }

    // The same as waitForItemDisplayed:
    async waitForProjectByDisplayNameDisplayed(displayName) {
        return await this.waitForItemDisplayed(displayName);
    }

    async clickOnCheckboxAndSelectRowByName(name) {
        try {
            let nameXpath = XPATH.projectCheckboxByName(name);
            await this.waitUntilDisplayed(nameXpath, appConst.mediumTimeout);
            let checkboxElements = await this.getDisplayedElements(nameXpath);
            if (checkboxElements.length === 0) {
                throw new Error(`Checkbox was not found in the project row, locator: ${nameXpath}`);
            }
            await checkboxElements[0].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Tried to click on the checkbox of the project: ${name}`, 'err_checkbox_proj', err);
        }
    }

    async clickOnProjectsFolderCheckbox() {
        try {
            let locator = XPATH.settingsTreeListDataComponent + XPATH.projectsFolderRow + XPATH.rowSelectionControl;
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                "Tried to click on the checkbox of 'Projects' folder",
                'err_projects_folder_checkbox',
                err,
            );
        }
    }

    // Returns false when the expander icon does not appear in the row within the short timeout:
    async isExpanderIconPresent(name) {
        try {
            await this.waitForElementDisplayed(this.expanderIconByDisplayName(name), appConst.shortTimeout);
            return true;
        } catch (err) {
            return false;
        }
    }

    async waitForSelectAllCheckboxDisplayed() {
        try {
            await this.waitForElementDisplayed(this.selectAllCheckboxLabel, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `'Select all' checkbox should be displayed in the tree list toolbar`,
                'err_select_all_checkbox',
                err,
            );
        }
    }

    // Returns the state of 'Select all' checkbox input: true when all rows are selected
    async isSelectAllCheckboxSelected() {
        try {
            let locator = this.selectAllCheckboxLabel + `//input[@type='checkbox']`;
            await this.waitForElementDisplayed(this.selectAllCheckboxLabel, appConst.mediumTimeout);
            let state = await this.getAttribute(locator, 'data-state');
            return state === 'checked';
        } catch (err) {
            await this.handleError(`Tried to get the state of 'Select all' checkbox`, 'err_select_all_state', err);
        }
    }

    // The old 'Selection Controller' checkbox is replaced with the 'Select all' checkbox in the tree list toolbar:
    async clickOnSelectionControllerCheckbox() {
        return await this.clickOnSelectAllCheckbox();
    }

    async waitForClearSelectionCheckboxDisplayed() {
        try {
            await this.waitForElementDisplayed(this.clearSelectionCheckboxLabel);
        } catch (err) {
            await this.handleError(
                `'Clear selection' checkbox should be displayed in the tree list toolbar`,
                'err_clear_selection_not_displayed',
                err,
            );
        }
    }

    async waitForClearSelectionCheckboxNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.clearSelectionCheckboxLabel);
        } catch (err) {
            await this.handleError(
                `'Clear selection' checkbox should not be displayed in the tree list toolbar`,
                'err_clear_selection_displayed',
                err,
            );
        }
    }

    async clickOnClearSelectionCheckbox() {
        try {
            await this.waitForElementDisplayed(this.clearSelectionCheckboxLabel);
            await this.clickOnElement(this.clearSelectionCheckboxLabel);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Tried to click on 'Clear selection' checkbox`, 'err_click_clear_selection', err);
        }
    }

    // Returns the number of selected rows shown in the 'Clear selection (N)' label:
    async getNumberInClearSelectionCheckbox() {
        try {
            await this.waitForElementDisplayed(this.clearSelectionCheckboxLabel);
            let text = await this.getText(this.clearSelectionCheckboxLabel);
            let result = text.match(/\((\d+)\)/);
            if (result === null) {
                throw new Error(`Number of selected items was not found in the label: '${text}'`);
            }
            return result[1];
        } catch (err) {
            await this.handleError(
                `'Clear selection' checkbox, tried to get the number of selected items`,
                'err_clear_selection_number',
                err,
            );
        }
    }

    async openProjectWizardDialog() {
        try {
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            // 1.'New...' button has been clicked:
            await this.clickOnNewButton();
            // 2. 'Project Wizard Dialog' should be loaded:
            await parentProjectStep.waitForLoaded();
            return parentProjectStep;
        } catch (err) {
            await this.handleError('Tried to open the Project Wizard dialog', 'err_open_project_wizard', err);
        }
    }

    async rightClickOnProjects() {
        try {
            const nameXpath = XPATH.settingsTreeListDataComponent + XPATH.projectsFolderRow;
            await this.waitForElementDisplayed(nameXpath);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            await this.handleError("Tried to right click on 'Projects' row", 'err_rightClick_projects', err);
        }
    }

    async rightClickOnProjectItemByDisplayName(displayName) {
        try {
            const nameXpath = XPATH.settingsTreeListDataComponent + XPATH.projectItemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            await this.handleError(`Tried to right click on the project row: ${displayName}`, 'err_rightClick', err);
        }
    }

    async checkProjectAndClickOnEditButton(displayName) {
        // the root folder(Projects) should be expanded:
        // 1. check the project:
        await this.clickOnCheckboxAndSelectRowByName(displayName);
        // 2. wait for Edit button gets enabled:
        await this.clickOnEditButton();
    }

    // Looks up a project row by its identifier (the <small> sub-name) and returns the bold display name
    // without the trailing language suffix (e.g. ' (en)') that the renderer appends as a nested span.
    async getProjectDisplayName(name) {
        try {
            return await this.doGetProjectDisplayName(name);
        } catch (err) {
            await this.handleError(
                `Tried to get the display name of the project with identifier: ${name}`,
                'err_project_display_name',
                err,
            );
        }
    }

    async doGetProjectDisplayName(name) {
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
        try {
            const identifierLocator =
                XPATH.settingsTreeListDataComponent +
                TREE_GRID.itemByDisplayName(displayName) +
                TREE_GRID.PROJECT_LABEL_IDENTIFIER_SMALL;
            await this.waitForElementDisplayed(identifierLocator);
            return await this.getText(identifierLocator);
        } catch (err) {
            await this.handleError(
                `Tried to get the identifier of the project: ${displayName}`,
                'err_project_identifier',
                err,
            );
        }
    }

    async waitForSyncButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.syncButton);
        } catch (err) {
            await this.handleError('Sync button should be enabled', 'err_sync_disabled_button', err);
        }
    }

    async waitForSyncButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.syncButton);
        } catch (err) {
            await this.handleError('Sync button should be displayed', 'err_sync_not_displayed_button', err);
        }
    }

    async waitForSyncButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.syncButton);
        } catch (err) {
            await this.handleError('Sync button should not be displayed', 'err_sync_displayed_button', err);
        }
    }

    async clickOnSyncButton() {
        try {
            await this.waitForSyncButtonEnabled();
            return await this.clickOnElement(this.syncButton);
        } catch (err) {
            await this.handleError(`Tried to click on 'Sync' button`, 'err_browsepanel_sync_button', err);
        }
    }

    async clickOnDeleteButton() {
        try {
            await this.waitForElementEnabled(this.deleteButton);
            return await this.clickOnElement(this.deleteButton);
        } catch (err) {
            await this.handleError(`Tried to click on 'Delete' button`, 'err_settings_delete_button', err);
        }
    }

    async waitForDeleteButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.deleteButton);
        } catch (err) {
            await this.handleError('Delete button should be disabled', 'err_delete_button_enabled', err);
        }
    }

    async waitForDeleteButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.deleteButton);
        } catch (err) {
            await this.handleError('Delete button should be enabled', 'err_delete_button_disabled', err);
        }
    }
}

module.exports = SettingsBrowsePanel;
