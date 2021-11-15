/**
 * Created on 04.11.2021
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BaseBrowsePanel = require('../../page_objects/base.browse.panel');


const XPATH = {
    container: "//div[contains(@id,'ArchiveBrowsePanel')]",
    settingsAppContainer: "//div[contains(@id,'SettingsAppContainer')]",
    toolbar: "//div[contains(@id,'Toolbar')]",
    archiveTreeGrid: `//div[contains(@id,'ArchiveTreeGrid')]`,
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

class ArchiveBrowsePanel extends BaseBrowsePanel {

    get deleteButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Delete...']]`;
    }

    get restoreButton() {
        return XPATH.settingsAppContainer + `/*[contains(@id, 'ActionButton') and child::span[text()='Restore...']]`;
    }

    get treeGrid() {
        return XPATH.container + XPATH.archiveTreeGrid;
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
        return XPATH.archiveTreeGrid + lib.H6_DISPLAY_NAME;
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
            console.log("item is not displayed:" + projectName);
            this.saveScreenshot('err_find_' + projectName);
            throw new Error('project is not displayed ! ' + projectName + "  " + err);
        }
    }

    async waitForItemByDisplayNameDisplayed(displayName) {
        try {
            let selector = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            return await this.waitForElementDisplayed(selector, appConst.longTimeout);
        } catch (err) {
            console.log("item is not displayed:" + displayName);
            this.saveScreenshot('err_find_' + displayName);
            throw new Error('Settings: item was not found ! ' + displayName + "  " + err);
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

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.itemsTreeGrid + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout);
            await this.clickOnElement(nameXpath);
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Project Browse Panel - Row with the displayName ' + displayName + ' was not found' + err)
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
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Project with the displayName ' + displayName + ' is not visible after ' + appConst.mediumTimeout + 'ms')
        }
    }

    clickOnCheckboxAndSelectRowByName(name) {
        let nameXpath = XPATH.projectCheckboxByName(name);
        return this.waitForElementDisplayed(nameXpath, appConst.shortTimeout).then(() => {
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

    async getNameInHighlightedRow() {
        try {
            await this.waitForElementDisplayed(XPATH.selectedRow, appConst.mediumTimeout);
            return await this.getText(XPATH.selectedRow + lib.H6_DISPLAY_NAME);
        } catch (err) {
            throw new Error(`Error when getting name in the selected row ` + err);
        }
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

    rightClickOnProjectItemByDisplayName(displayName) {
        const nameXpath = XPATH.container + XPATH.projectItemByDisplayName(displayName);
        return this.waitForElementDisplayed(nameXpath, appConst.mediumTimeout).then(() => {
            return this.doRightClick(nameXpath);
        }).catch(err => {
            throw Error(`Error when do right click on the row:` + err);
        })
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
}

module.exports = ArchiveBrowsePanel;
