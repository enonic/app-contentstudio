const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ProjectWizardPanel = require('./project.wizard.panel');

const XPATH = {
    container: `//div[contains(@id,'ProjectWizardPanel')]`,
    languageProjectFormItem: "//div[contains(@id,'LocaleFormItem') and descendant::span[text()='Default Language']]",
    accessModeProjectFormItem: "//div[contains(@id,'ProjectReadAccessFormItem') and descendant::span[text()='Access mode']]",
    projectRolesWizardStepFormDiv: "//div[contains(@id,'ProjectRolesWizardStepForm')]",
    copyButton: label => `//button[child::span[text()='Copy from ${label}']]`,
    projectSelectedOptionView: "//div[contains(@id,'ParentProjectFormItem')]",
};

class LayerWizardPanel extends ProjectWizardPanel {

    get copyLanguageFormItem() {
        return XPATH.container + XPATH.languageProjectFormItem;
    }

    get copyAccessModeFormItem() {
        return XPATH.container + XPATH.accessModeProjectFormItem;
    }

    get copyRolesFormItem() {
        return XPATH.container + XPATH.projectRolesWizardStepFormDiv;
    }

    async clickOnCopyLanguageFromParent(parent) {
        await this.waitForCopyLanguageFromParentEnabled(parent);
        let locator = this.copyLanguageFormItem + XPATH.copyButton(parent);
        return await this.clickOnElement(locator);
    }

    async clickOnCopyAccessModeFromParent(parent) {
        let locator = this.copyAccessModeFormItem + XPATH.copyButton(parent);
        await this.waitForCopyAccessModeFromParentEnabled(parent);
        return await this.clickOnElement(locator);
    }

    async clickOnCopyRolesFromParent(parent) {
        await this.clickOnWizardStep('Roles');
        await this.waitForCopyRolesFromParentEnabled(parent);
        let locator = this.copyRolesFormItem + XPATH.copyButton(parent);
        return await this.clickOnElement(locator);
    }

    waitForCopyLanguageFromParentEnabled(parent) {
        let locator = this.copyLanguageFormItem + XPATH.copyButton(parent);
        return this.waitForElementEnabled(locator, appConst.mediumTimeout);
    }

    async waitForCopyLanguageFromParentDisabled(parent) {
        let locator = this.copyLanguageFormItem + XPATH.copyButton(parent);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.waitForElementDisabled(locator, appConst.mediumTimeout);
    }

    waitForCopyAccessModeFromParentEnabled(parent) {
        let locator = this.copyAccessModeFormItem + XPATH.copyButton(parent);
        return this.waitForElementEnabled(locator, appConst.mediumTimeout);
    }

    async waitForCopyAccessModeFromParentDisabled(parent) {
        let locator = this.copyAccessModeFormItem + XPATH.copyButton(parent);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.waitForElementDisabled(locator, appConst.mediumTimeout);
    }

    waitForCopyRolesFromParentEnabled(parent) {
        let locator = this.copyRolesFormItem + XPATH.copyButton(parent);
        return this.waitForElementEnabled(locator, appConst.mediumTimeout);
    }

    async waitForCopyRolesFromParentDisabled(parent) {
        let locator = this.copyRolesFormItem + XPATH.copyButton(parent);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.waitForElementDisabled(locator, appConst.mediumTimeout);
    }

    async getParentProjectName() {
        try {
            let locator = XPATH.projectSelectedOptionView +
                          "//div[contains(@id,'ProjectSelectedOptionView')]//h6[contains(@class,'main-name')]//span[contains(@class,'display-name')]";
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_layer_parent');
            throw new Error("Error, Layer wizard, parent project name: screenshot " + screenshot + "  " + err);
        }
    }
}

module.exports = LayerWizardPanel;
