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
    toolbar: `//div[contains(@id,'SettingsBrowseToolbar')]`,
    itemsTreeGrid: `//div[contains(@id,'SettingsItemsTreeGrid')]`,
    treeGridToolbar: `//div[contains(@id,'TreeGridToolbar')]`,
    selectionControllerCheckBox: `//div[contains(@id,'SelectionController')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    selectedRow: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::div[contains(@class,'slick-cell') and contains(@class,'highlight')]]`,
    checkedRows: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-cell-checkboxsel selected')]`,
    showIssuesButton: "//button[contains(@id,'ShowIssuesDialogButton')]//span",

    contextMenuItemByName: (name) => {
        return `${lib.TREE_GRID_CONTEXT_MENU}/li[contains(@id,'MenuItem') and contains(.,'${name}')]`;
    },
    rootFolderByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,

    projectItemByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and descendant::span[contains(@class,'display-name') and contains(.,'${displayName}')]]`,

    projectCheckboxByName: name => {
        return `${lib.projectByName(name)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },

    projectItemByName: function (name) {
        return `//div[contains(@id,'NamesView') and descendant::span[@class='display-name' and contains(.,'${name}')]]`
    },
    expanderIconByName: name => `${lib.itemByDisplayName(
        name)}/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`,

    getProjectDescription: name => `${lib.itemByName(
        name)}/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`,

    tabCloseIcon: projectDisplayName => XPATH.appBarTabMenu +
                                        `//li[contains(@id,'AppBarTabMenuItem') and descendant::a[contains(.,'${projectDisplayName}')]]/button`
}

class SettingsBrowsePanel extends BaseBrowsePanel {

    get deleteButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Delete']]`;
    }

    get homeButton() {
        return XPATH.appBar + XPATH.homeButton;
    }

    get newButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='New...']]`;
    }

    get editButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
    }

    get syncButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Sync']]`;
    }

    get treeGrid() {
        return XPATH.container + XPATH.itemsTreeGrid;
    }

    get selectionControllerCheckBox() {
        return XPATH.container + XPATH.treeGridToolbar + XPATH.selectionControllerCheckBox;
    }

    get selectionPanelToggler() {
        return `${XPATH.container}${XPATH.treeGridToolbar}${lib.SELECTION_PANEL_TOGGLER}`;
    }

    get numberInToggler() {
        return XPATH.treeGridToolbar + XPATH.numberInSelectionToggler;
    }

    get displayNames() {
        return XPATH.itemsTreeGrid + lib.H6_DISPLAY_NAME;
    }

    //returns array with displayName of all items in the Settings Browse Panel
    getDisplayNames() {
        let selector = this.treeGrid + lib.H6_DISPLAY_NAME + "/span[@class='display-name']";
        return this.getTextInElements(selector);
    }

    async clickOnExpanderIcon(name) {
        try {
            let expanderIcon = XPATH.itemsTreeGrid + XPATH.expanderIconByName(name);
            await this.clickOnElement(expanderIcon);
            return await this.pause(1100);
        } catch (err) {
            this.saveScreenshot('err_click_on_expander');
            throw new Error('error when click on expander-icon ' + err);
        }
    }

    async waitForItemDisplayed(projectName) {
        try {
            return await this.waitForElementDisplayed(XPATH.itemsTreeGrid + XPATH.projectItemByName(projectName), appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_project");
            await this.saveScreenshot(screenshot);
            throw new Error('project is not displayed ! Screenshot: ' + screenshot + "  " + err);
        }
    }

    async waitForItemByDisplayNameDisplayed(displayName) {
        try {
            let selector = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(selector, appConst.longTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_find_');
            await this.saveScreenshot(screenshot);
            throw new Error('Settings: project item with the display name was not found ! Screenshot: ' + screenshot + "   " + err);
        }
    }

    async waitForLanguageIconDisplayed(displayName) {
        try {
            let locatorIcon = XPATH.itemsTreeGrid +
                              `//div[contains(@id,'NamesAndIconView') and descendant::span[contains(@class,'display-name') and contains(.,'${displayName}')]]` +
                              "//div[contains(@id,'Flag')]";
            await this.waitForElementDisplayed(locatorIcon, appConst.longTimeout);
            return await this.getAttribute(locatorIcon, "data-code");
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_language_icon");
            await this.saveScreenshot(screenshot);
            throw new Error('Settings: language  icon was not found ! ' + screenshot + "  " + err);
        }
    }

    async waitForProjectNotDisplayed(projectDisplayName) {
        try {
            let selector = XPATH.itemsTreeGrid + lib.itemByDisplayName(projectDisplayName);
            return await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("projectName is still displayed :" + err);
        }
    }

    //Click on SETTINGS button:
    async clickOnHomeButton() {
        await this.waitForElementDisplayed(this.homeButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.homeButton);
    }

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(400);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_find_project");
            await this.saveScreenshot(screenshot);
            throw Error('Project Browse Panel - project was not found ' + screenshot + '  ' + err);
        }
    }

    waitForItemByNameVisible(name) {
        let nameXpath = XPATH.itemsTreeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' is not visible after ' + appConst.mediumTimeout + 'ms')
        })
    }

    async waitForProjectByDisplayNameVisible(displayName) {
        try {
            let nameXpath = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_find_project");
            await this.saveScreenshot(screenshot);
            throw Error('Project is not visible, screenshot:' + screenshot + "  " + err);
        }
    }

    async clickOnCheckboxAndSelectRowByName(name) {
        try {
            let nameXpath = XPATH.projectCheckboxByName(name);
            await this.waitForElementDisplayed(nameXpath, appConst.shortTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(300);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_checkbox");
            await this.saveScreenshot(screenshot);
            throw Error("Project's checkbox was not found Screenshot:" + screenshot + "  " + err);
        }
    }

    getNumberOfSelectedRows() {
        return this.findElements(XPATH.selectedRow).then(result => {
            return result.length;
        }).catch(err => {
            throw new Error(`Error when getting selected rows ` + err);
        });
    }

    async getNameInHighlightedRow() {
        try {
            await this.waitForElementDisplayed(XPATH.selectedRow, appConst.mediumTimeout);
            return await this.getText(XPATH.selectedRow + lib.H6_DISPLAY_NAME);
        } catch (err) {
            throw new Error(`Error when getting name in the selected row ` + err);
        }
    }

    async getNumberOfCheckedRows() {
        try {
            let result = await this.findElements(XPATH.checkedRows);
            return result.length;
        } catch (err) {
            let screenshotName = appConst.generateRandomName("err_browse_rows");
            await this.saveScreenshot(screenshotName);
            throw new Error(`Error when getting selected rows, screenshot:  ` + screenshotName + "  " + err);
        }
    }

    isExpanderIconPresent(name) {
        let expanderIcon = XPATH.itemsTreeGrid + XPATH.expanderIconByName(name);
        return this.waitForElementDisplayed(expanderIcon).catch(err => {
            this.saveScreenshot('expander_not_exists ' + name);
            return false;
        })
    }

    async openProjectWizardDialog() {
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let projectWizard = new ProjectWizard();
        //1.'New...' button has been clicked:
        await this.clickOnNewButton();
        //2. 'Project Wizard Dialog' should be loaded:
        await parentProjectStep.waitForLoaded();
        return parentProjectStep;
    }

    async selectParentAndOpenProjectWizardDialog(parentName) {
        await this.clickOnRowByDisplayName(parentName);
        await this.clickOnNewButton();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        await parentProjectStep.waitForLoaded();
        return parentProjectStep;
    }

    async rightClickOnProjects() {
        try {
            const nameXpath = XPATH.container + XPATH.rootFolderByDisplayName("Projects");
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_rightClick"));
            throw Error(`Error when do right click on the row:` + err);
        }
    }

    async rightClickOnProjectItemByDisplayName(displayName) {
        try {
            const nameXpath = XPATH.container + XPATH.projectItemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            return await this.doRightClick(nameXpath);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_rightClick"));
            throw Error(`Error when do right click on the row:` + err);
        }
    }

    async openProjectByDisplayName(displayName) {
        let projectWizard = new ProjectWizard();
        // the root folder(Projects) should be expanded:
        //1. click on the project:
        await this.clickOnRowByDisplayName(displayName);
        //2. wait for Edit button gets enabled:
        await this.clickOnEditButton();
        //3. wait for Project is loaded in the wizard page:
        return await projectWizard.waitForLoaded();
    }

    async checkAndOpenProjectByDisplayName(displayName) {
        let projectWizard = new ProjectWizard();
        // the root folder(Projects) should be expanded:
        //1. check the project:
        await this.clickOnCheckboxAndSelectRowByName(displayName);
        //2. wait for Edit button gets enabled:
        await this.clickOnEditButton();
        //3. wait for Project is loaded:
        await projectWizard.waitForLoaded();
        return projectWizard;
    }

    getProjectDisplayName(name) {
        let selector = XPATH.projectItemByName(name) + "//span[@class='display-name']";
        return this.getText(selector)
    }

    getProjectDescription(name) {
        let selector = XPATH.projectItemByName(name) + "//p[contains(@class,'sub-name')]";
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

    waitForSyncButtonEnabled() {
        return this.waitForElementEnabled(this.syncButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_sync_disabled_button');
            throw Error('Sync button should be enabled, timeout: ' + appConst.mediumTimeout + 'ms')
        })
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
            await this.saveScreenshot('err_browsepanel_delete_button');
            throw new Error('Delete button is not enabled! ' + err);
        }
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_delete_disabled_button');
            throw Error('Browse toolbar - Delete button should be disabled, timeout: ' + 3000 + 'ms')
        })
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_delete_button');
            throw Error('Delete button is not enabled after ' + appConst.mediumTimeout + 'ms')
        })
    }
}

module.exports = SettingsBrowsePanel;
