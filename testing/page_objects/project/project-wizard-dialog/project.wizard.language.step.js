/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ComboBox = require('../../components/loader.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    localeStep: "//form[contains(@class,'project-language-step')]",
    projectSelectedOptionView: "//div[contains(@id,'ProjectSelectedOptionView')]",
    localeComboBoxDiv: "//div[contains(@id,'LocaleComboBox')]",
    languageSelectedOption: "//div[contains(@id,'LocaleSelectedOptionView')]",
};
const DESCRIPTION = "Select default language for a new content in the project";

class ProjectWizardDialogLanguageStep extends ProjectWizardDialog {

    get removeLanguageButton() {
        return XPATH.container + XPATH.languageSelectedOption + lib.REMOVE_ICON;
    }

    get languageOptionsFilterInput() {
        return XPATH.container + XPATH.localeComboBoxDiv + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    waitForLanguageFilterInputDisplayed() {
        try {
            return this.waitForElementDisplayed(this.languageOptionsFilterInput, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_proj_wizard_language");
            throw new Error("Language filter input should be visible, screenshot:" + screenshot + "  " + err);
        }
    }

    async clickOnRemoveSelectedLanguageIcon() {
        await this.waitForElementDisplayed(this.removeLanguageButton, appConst.mediumTimeout);
        await this.clickOnElement(this.removeLanguageButton);
    }

    async selectLanguage(language) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(language, XPATH.localeStep + XPATH.localeComboBoxDiv);
        console.log("Project Wizard, language is selected: " + language);
        return await this.pause(300);
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 2 is not loaded"});
    }
}

module.exports = ProjectWizardDialogLanguageStep;

