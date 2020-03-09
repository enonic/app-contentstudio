/**
 * Created on 5/03/2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ConfirmationDialog = require('../confirmation.dialog');
const BaseBrowsePanel = require('../../page_objects/base.browse.panel');

const XPATH = {
    container: "//div[contains(@id,'SettingsBrowsePanel')]",
    toolbar: `//div[contains(@id,'SettingsBrowseToolbar')]`,
    treeGridToolbar: `//div[contains(@id,'ContentTreeGridToolbar')]`,
    treeGrid: `//div[contains(@id,'SettingsItemsTreeGrid')]`,
    treeGridToolbar: `//div[contains(@id,'TreeGridToolbar')]`,
    selectionControllerCheckBox: `//div[contains(@id,'SelectionController')]`,
    selectionPanelToggler: `//button[contains(@id,'SelectionPanelToggler')]`,
    numberInSelectionToggler: `//button[contains(@id,'SelectionPanelToggler')]/span`,
    selectedRow: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-row') and descendant::div[contains(@class,'slick-cell') and contains(@class,'highlight')]]`,
    checkedRows: `//div[contains(@class,'slick-viewport')]//div[contains(@class,'slick-cell-checkboxsel selected')]`,
    rowByDisplayName:
        displayName => `//div[contains(@id,'NamesView') and child::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,

    checkboxByName: function (name) {
        return `${lib.itemByName(
            name)}/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label`
    },

    checkboxByDisplayName: displayName => XPATH.container + lib.itemByDisplayName(displayName) +
                                          "/ancestor::div[contains(@class,'slick-row')]/div[contains(@class,'slick-cell-checkboxsel')]/label",

    expanderIconByName: name => `${lib.itemByName(
        name)}/ancestor::div[contains(@class,'slick-cell')]/span[contains(@class,'collapse') or contains(@class,'expand')]`,
}

class SettingsBrowsePanel extends BaseBrowsePanel {

    get deleteButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Delete']]`;
    }

    get newButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='New...']]`;
    }

    get editButton() {
        return XPATH.toolbar + `/*[contains(@id, 'ActionButton') and child::span[text()='Edit']]`;
    }

    get selectionControllerCheckBox() {
        return XPATH.treeGridToolbar + XPATH.selectionControllerCheckBox;
    }

    get selectionPanelToggler() {
        return `${XPATH.treeGridToolbar}${XPATH.selectionPanelToggler}`;
    }

    get numberInToggler() {
        return XPATH.treeGridToolbar + XPATH.numberInSelectionToggler;
    }

    get displayNames() {
        return XPATH.treeGrid + lib.H6_DISPLAY_NAME;
    }

    async clickOnExpanderIcon(name) {
        try {
            let expanderIcon = XPATH.treeGrid + XPATH.expanderIconByName(name);
            await this.clickOnElement(expanderIcon);
            return await this.pause(900);
        } catch (err) {
            this.saveScreenshot('err_click_on_expander');
            throw new Error('error when click on expander-icon ' + err);
        }
    }

    async waitForItemDisplayed(projectName) {
        try {
            return await this.waitForElementDisplayed(XPATH.treeGrid + lib.itemByName(projectName), appConst.TIMEOUT_3);
        } catch (err) {
            console.log("item is not displayed:" + projectName);
            this.saveScreenshot('err_find_' + projectName)
            throw new Error('projectName is not displayed ! ' + projectName + "  " + err);
        }
    }

    async waitForItemByDisplayNameDisplayed(displayName) {
        try {
            return await this.waitForElementDisplayed(XPATH.treeGrid + lib.itemByDisplayName(displayName), appConst.TIMEOUT_3);
        } catch (err) {
            console.log("item is not displayed:" + displayName);
            this.saveScreenshot('err_find_' + displayName)
            throw new Error('Setings: item was not found ! ' + displayName + "  " + err);
        }
    }

    waitForProjectNotDisplayed(projectName) {
        return this.waitForElementNotDisplayed(XPATH.treeGrid + lib.itemByName(projectName), appConst.TIMEOUT_3).catch(err => {
            throw new Error("projectName is still displayed :" + err);
        });
    }

    clickOnDeleteButton() {
        return this.waitForElementEnabled(this.deleteButton, 2000).then(() => {
            return this.clickOnElement(this.deleteButton);
        }).catch(err => {
            this.saveScreenshot('err_browsepanel_delete');
            throw new Error('Delete button is not enabled! ' + err);
        })
    }


    clickOnRowByName(name) {
        let nameXpath = XPATH.treeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, 3000).then(() => {
            return this.clickOnElement(nameXpath);
        }).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' was not found' + err);
        }).then(() => {
            return this.pause(300);
        });
    }

    async clickOnRowByDisplayName(displayName) {
        try {
            let nameXpath = XPATH.treeGrid + lib.itemByDisplayName(displayName);
            await this.waitForElementDisplayed(nameXpath, 3000);
            await this.clickOnElement(nameXpath);
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot('err_find_' + displayName);
            throw Error('Project Browse Panel - Row with the displayName ' + displayName + ' was not found' + err)
        }
    }

    waitForRowByNameVisible(name) {
        let nameXpath = XPATH.treeGrid + lib.itemByName(name);
        return this.waitForElementDisplayed(nameXpath, 3000).catch(err => {
            this.saveScreenshot('err_find_' + name);
            throw Error('Row with the name ' + name + ' is not visible after ' + 3000 + 'ms')
        })
    }

    async waitForProjectByDisplayNameVisible(displayName) {
        try {
            let nameXpath = XPATH.treeGrid + lib.itemByDisplayName(displayName);
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
        let nameXpath = XPATH.checkboxByName(name);
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
        let expanderIcon = XPATH.treeGrid + XPATH.expanderIconByName(name);
        return this.waitForElementDisplayed(expanderIcon).catch(err => {
            this.saveScreenshot('expander_not_exists ' + name);
            return false;
        })
    }
};
module.exports = SettingsBrowsePanel;
