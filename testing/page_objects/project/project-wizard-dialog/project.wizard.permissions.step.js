/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ComboBox = require('../../components/loader.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    projectAccessControlComboBox: "//div[contains(@id,'ProjectAccessControlComboBox')]",
    accessItemByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    accessItemByDisplayName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`,
};
const DESCRIPTION = "Give access to manage the project and its content";

class ProjectWizardDialogPermissionsStep extends ProjectWizardDialog {

    //Adds a user with the default role (Contributor) in Roles step form:
    async selectProjectAccessRole(principalDisplayName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(principalDisplayName, XPATH.container + XPATH.projectAccessControlComboBox);
        return await this.pause(300);
    }

    addPrincipalsInRolesForm(memberDisplayNames) {
        let result = Promise.resolve();
        memberDisplayNames.forEach(displayName => {
            result = result.then(() => this.selectProjectAccessRole(displayName));
        });
        return result;
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 4 is not loaded"});
    }

    async expandProjectAccessMenuAndSelectRole(principalName, role) {
        let locator = XPATH.container + XPATH.accessItemByName(principalName) + XPATH.projectAccessSelectorTabMenu;
        await this.clickOnElement(locator);
        await this.waitForProjectAccessSelectorTabMenuExpanded(principalName);
        await this.pause(500);
        await this.waitForElementDisplayed(locator + `//li[contains(@id,'TabMenuItem') and child::a[text()='${role}']]`,
            appConst.shortTimeout);
        await this.clickOnElement(locator + `//li[contains(@id,'TabMenuItem') and child::a[text()='${role}']]`);
        return await this.pause(500);
    }

    //click on the role, open menu and select new role for the user:
    async updateUserAccessRole(userDisplayName, newRole) {
        let menuLocator = XPATH.container + XPATH.projectAccessControlComboBox + XPATH.accessItemByName(userDisplayName) +
                          "//div[contains(@id,'TabMenuButton')]";
        await this.waitForElementEnabled(menuLocator, appConst.mediumTimeout);
        await this.clickOnElement(menuLocator);
        await this.pause(400);
        let menuItem = XPATH.container + XPATH.projectAccessControlComboBox + XPATH.accessItemByName(userDisplayName) +
                       lib.tabMenuItem(newRole);
        await this.waitForElementDisplayed(menuItem, appConst.shortTimeout);
        await this.pause(300);
        await this.clickOnElement(menuItem);
        return await this.pause(500);
    }

    //clicks on remove icon and  remove a user from Roles form:
    async removeProjectAccessItem(principalName) {
        try {
            let selector = XPATH.container + XPATH.accessItemByDisplayName(principalName) + lib.REMOVE_ICON;
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_remove_principal");
            await this.saveScreenshot(screenshot);
            throw new Error("Error when trying to remove project Access Item, screenshot: " + screenshot + "  " + err);
        }
    }

    //gets selected options - return names of selected principals:
    async getSelectedPrincipals() {
        let locator = XPATH.container + "//div[contains(@id,'PrincipalContainerSelectedOptionView')]//h6[contains(@class,'main-name')]"
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ProjectWizardDialogPermissionsStep;

