/**
 * Created on 5/03/2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BaseBrowsePanel = require('../../page_objects/base.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const NewSettingsItemDialog = require('../../page_objects/project/new.settings.item.dialog');

const XPATH = {
    container: "//div[contains(@id,'SettingsBrowsePanel')]",
    settingsAppContainer: "//div[contains(@id,'SettingsAppContainer')]",
    appBar: "//div[contains(@id,'SettingsAppBar')]",
    appBarTabMenu: "//div[contains(@id,'AppBarTabMenu')]",
    homeButton: "//div[contains(@class,'home-button') and descendant::span[text()='Settings']]",
    toolbar: `//div[contains(@id,'SettingsBrowseToolbar')]`,
    itemsTreeGrid: `//div[contains(@id,'SettingsItemsTreeGrid')]`,
    treeGridToolbar: `//div[contains(@id,'TreeGridToolbar')]`,
    selectionControllerCheckBox: `//div[contains(@id,'SelectionController')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    selectedRow: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::div[contains(@class,'slick-cell') and contains(@class,'highlight')]]`,
    checkedRows: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-cell-checkboxsel selected')]`,

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
    checkboxByDisplayName: displayName => XPATH.container + lib.itemByDisplayName(displayName) +
                                          "/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label",

    projectItemByName: function (name) {
        return `//div[contains(@id,'NamesView') and descendant::span[@class='name' and contains(.,'${name}')]]`
    },
    expanderIconByName: name => `${lib.itemByName(
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
        return XPATH.settingsAppContainer + XPATH.homeButton;
    }

    get newButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='New...']]`;
    }

    get editButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
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
            return await this.pause(900);
        } catch (err) {
            this.saveScreenshot('err_click_on_expander');
            throw new Error('error when click on expander-icon ' + err);
        }
    }

    async waitForItemDisplayed(projectName) {
        try {
            return await this.waitForElementDisplayed(XPATH.itemsTreeGrid + lib.itemByName(projectName), appConst.TIMEOUT_3);
        } catch (err) {
            console.log("item is not displayed:" + projectName);
            this.saveScreenshot('err_find_' + projectName)
            throw new Error('projectName is not displayed ! ' + projectName + "  " + err);
        }
    }

    async waitForItemByDisplayNameDisplayed(displayName) {
        try {
            let selector = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(selector, appConst.TIMEOUT_3);
        } catch (err) {
            console.log("item is not displayed:" + displayName);
            this.saveScreenshot('err_find_' + displayName)
            throw new Error('Settings: item was not found ! ' + displayName + "  " + err);
        }
    }

    async waitForProjectNotDisplayed(projectDisplayName) {
        try {
            let selector = XPATH.itemsTreeGrid + lib.itemByDisplayName(projectDisplayName);
            return await this.waitForElementNotDisplayed(selector, appConst.TIMEOUT_3);
        } catch (err) {
            throw new Error("projectName is still displayed :" + err);
        }
    }

    clickOnHomeButton() {
        return this.clickOnElement(this.homeButton);
    }

    clickOnDeleteButton() {
        return this.waitForElementEnabled(this.deleteButton, 2000).then(() => {
            return this.clickOnElement(this.deleteButton);
        }).catch(err => {
            this.saveScreenshot('err_browsepanel_delete');
            throw new Error('Delete button is not enabled! ' + err);
        })
    }

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, 3000);
            await this.clickOnElement(nameXpath);
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Project Browse Panel - Row with the displayName ' + displayName + ' was not found' + err)
        }
    }

    waitForItemByNameVisible(name) {
        let nameXpath = XPATH.itemsTreeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, 3000).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' is not visible after ' + 3000 + 'ms')
        })
    }

    async waitForProjectByDisplayNameVisible(displayName) {
        try {
            let nameXpath = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(nameXpath, 3000);
        } catch (err) {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Project with the displayName ' + displayName + ' is not visible after ' + 3000 + 'ms')
        }
    }

    async clickCheckboxAndSelectRowByDisplayName(displayName) {
        try {
            const displayNameXpath = XPATH.checkboxByDisplayName(displayName);
            await this.waitForElementDisplayed(displayNameXpath, 2000);
            await this.clickOnElement(displayNameXpath);
            return await this.pause(400);
        } catch (err) {
            this.saveScreenshot('err_find_item');
            throw Error(`Row with the displayName ${displayName} was not found.` + err);
        }
    }

    clickOnCheckboxAndSelectRowByName(name) {
        let nameXpath = XPATH.projectCheckboxByName(name);
        return this.waitForElementDisplayed(nameXpath, 2000).then(() => {
            return this.clickOnElement(nameXpath);
        }).then(() => {
            return this.pause(300);
        }).catch(err => {
            this.saveScreenshot('err_find_item');
            throw Error('Row with the name ' + name + ' was not found ' + err)
        })
    }

    getNumberOfSelectedRows() {
        return this.findElements(XPATH.selectedRow).then(result => {
            return result.length;
        }).catch(err => {
            throw new Error(`Error when getting selected rows ` + err);
        });
    }

    getNameOfSelectedRow() {
        return this.findElements(XPATH.selectedRow).then(result => {
            return this.getText(XPATH.selectedRow + lib.H6_DISPLAY_NAME);
        }).catch(err => {
            throw new Error(`Error when getting selected rows ` + err);
        });
    }

    getNumberOfCheckedRows() {
        return this.findElements(XPATH.checkedRows).then(result => {
            return result.length;
        }).catch(err => {
            throw new Error(`Error when getting selected rows ` + err);
        });
    }

    isExpanderIconPresent(name) {
        let expanderIcon = XPATH.itemsTreeGrid + XPATH.expanderIconByName(name);
        return this.waitForElementDisplayed(expanderIcon).catch(err => {
            this.saveScreenshot('expander_not_exists ' + name);
            return false;
        })
    }

    async openProjectWizard() {
        let newSettingsItemDialog = new NewSettingsItemDialog();
        let projectWizard = new ProjectWizard();
        //2.'New...' button has been clicked:
        await this.clickOnNewButton();
        //3. 'NewSettingsItem' dialog should be loaded:
        await newSettingsItemDialog.waitForDialogLoaded();
        //4. Expected title should be loaded:
        await newSettingsItemDialog.clickOnProjectItem();
        return await projectWizard.waitForLoaded();
    }

    rightClickOnProjects() {
        const nameXpath = XPATH.container + XPATH.rootFolderByDisplayName("Projects");
        return this.waitForElementDisplayed(nameXpath, appConst.TIMEOUT_3).then(() => {
            return this.doRightClick(nameXpath);
        }).catch(err => {
            throw Error(`Error when do right click on the row:` + err);
        })
    }

    rightClickOnProjectItemByDisplayName(displayName) {
        const nameXpath = XPATH.container + XPATH.projectItemByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, appConst.TIMEOUT_3).then(() => {
            return this.doRightClick(nameXpath);
        }).catch(err => {
            throw Error(`Error when do right click on the row:` + err);
        })
    }

    async openProjectByDisplayName(displayName) {
        let projectWizard = new ProjectWizard();
        //1.Expand the root folder:
        await this.clickOnExpanderIcon(appConst.PROJECTS.ROOT_FOLDER_DESCRIPTION);
        //2. click on the project:
        await this.clickOnRowByDisplayName(displayName);
        //3. wait for Edit button gets enabled:
        await this.clickOnEditButton();
        //4. wait for Project is loaded in the wizard page:
        return await projectWizard.waitForLoaded();
    }

    getProjectDisplayName(name) {
        let selector = XPATH.projectItemByName(name) + "//span[@class='display-name']";
        return this.getText(selector)
    }

    getProjectDescription(name) {
        let selector = XPATH.projectItemByName(name) + "//p[contains(@class,'sub-name')]"
        return this.getText(selector)
    }

    async clickOnCloseIcon(displayName) {
        let selector = XPATH.tabCloseIcon(displayName);
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        return await this.clickOnElement(selector);
    }

    async getNumberOpenedTabItems() {
        let selector = XPATH.settingsAppContainer + "//li[contains(@id,'AppBarTabMenuItem')]";
        let result = await this.getDisplayedElements(selector);
        return result.length;
    }
};
module.exports = SettingsBrowsePanel;
