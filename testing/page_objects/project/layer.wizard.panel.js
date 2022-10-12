const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ProjectWizardPanel = require('./project.wizard.panel');

const XPATH = {
    container: `//div[contains(@id,'ProjectWizardPanel')]`,
    languageProjectFormItem: "//div[contains(@id,'LocaleFormItem') and descendant::label[text()='Default Language']]",
    accessModeProjectFormItem: "//div[contains(@id,'ProjectReadAccessFormItem') and descendant::label[text()='Access mode']]",
    projectRolesWizardStepFormDiv: "//div[contains(@id,'ProjectRolesWizardStepForm')]",
    copyButton: "//button[child::span[text()='Copy from parent']]",
    projectSelectedOptionView: "//div[contains(@id,'ParentProjectFormItem')]",
};

class LayerWizardPanel extends ProjectWizardPanel {

    get copyLanguageFromParentButton() {
        return XPATH.container + XPATH.languageProjectFormItem + XPATH.copyButton;
    }

    get copyAccessModeFromParentButton() {
        return XPATH.container + XPATH.accessModeProjectFormItem + XPATH.copyButton;
    }

    get copyRolesFromParentButton() {
        return XPATH.container + XPATH.projectRolesWizardStepFormDiv + XPATH.copyButton;
    }

    async clickOnCopyLanguageFromParent() {
        await this.waitForCopyLanguageFromParentEnabled();
        return await this.clickOnElement(this.copyLanguageFromParentButton);
    }

    async clickOnCopyAccessModeFromParent() {
        await this.waitForCopyAccessModeFromParentEnabled();
        return await this.clickOnElement(this.copyAccessModeFromParentButton);
    }

    async clickOnCopyRolesFromParent() {
        await this.clickOnWizardStep("Roles");
        await this.waitForCopyRolesFromParentEnabled();
        return await this.clickOnElement(this.copyRolesFromParentButton);
    }

    waitForCopyLanguageFromParentEnabled() {
        return this.waitForElementEnabled(this.copyLanguageFromParentButton, appConst.mediumTimeout);
    }

    async waitForCopyLanguageFromParentDisabled() {
        await this.waitForElementDisplayed(this.copyLanguageFromParentButton, appConst.mediumTimeout);
        return await this.waitForElementDisabled(this.copyLanguageFromParentButton, appConst.mediumTimeout);
    }

    waitForCopyAccessModeFromParentEnabled() {
        return this.waitForElementEnabled(this.copyAccessModeFromParentButton, appConst.mediumTimeout);
    }

    async waitForCopyAccessModeFromParentDisabled() {
        await this.waitForElementDisplayed(this.copyAccessModeFromParentButton, appConst.mediumTimeout);
        return await this.waitForElementDisabled(this.copyAccessModeFromParentButton, appConst.mediumTimeout);
    }

    waitForCopyRolesFromParentEnabled() {
        return this.waitForElementEnabled(this.copyRolesFromParentButton, appConst.mediumTimeout);
    }

    async waitForCopyRolesFromParentDisabled() {
        await this.waitForElementDisplayed(this.copyRolesFromParentButton, appConst.mediumTimeout);
        return await this.waitForElementDisabled(this.copyRolesFromParentButton, appConst.mediumTimeout);
    }

    async getParentProjectName() {
        try {
            let locator = XPATH.projectSelectedOptionView +
                          "//div[contains(@id,'ProjectSelectedOptionView')]//h6[contains(@class,'main-name')]//span[contains(@class,'display-name')]";
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_layer_parent")
            await this.saveScreenshot(screenshot);
            throw new Error("Error, Layer wizard, parent project name: screenshot " + screenshot + "  " + err);
        }
    }
}

module.exports = LayerWizardPanel;
