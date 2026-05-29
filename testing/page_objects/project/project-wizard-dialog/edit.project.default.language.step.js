/**
 * Created on 22.05.2026
 */
const appConst = require('../../../libs/app_const');
const LocaleSelectorDropdown = require("../../components/selectors/locale.selector.dropdown");
const ProjectWizardDialog = require("./project.wizard.dialog");

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Default language for project content')]]",
    parentProjectLabelSpan: "//div[@data-component='ProjectLabel']//span[contains(@class,'font-semibold')]",
    selectedLanguageSpan:
        "//div[@data-component='LanguageSelector']/following-sibling::div[@data-component='GridList']" +
        "//div[@data-component='GridList.Row']//div[@data-component='GridList.Cell'][1]//span",
};
const TITLE = "Default language for project content";

class EditProjectDefaultLanguageStep extends ProjectWizardDialog {

    get container() {
        return XPATH.container;
    }

    // Parent project is optional on this step. Returns null when no parent project is set.
    async getSelectedProject() {
        const locator = XPATH.container + XPATH.parentProjectLabelSpan;
        const isDisplayed = await this.isElementDisplayed(locator);
        if (!isDisplayed) {
            return null;
        }
        return await this.getText(locator);
    }

    async isParentProjectDisplayed() {
        const locator = XPATH.container + XPATH.parentProjectLabelSpan;
        return await this.isElementDisplayed(locator);
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(XPATH.container);
    }

    async getSelectedLanguage() {
        const locator = XPATH.container + XPATH.selectedLanguageSpan;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async selectLanguage(language) {
        if (!language) {
            return;
        }
        let localeSelectorDropdown = new LocaleSelectorDropdown(XPATH.container);
        await localeSelectorDropdown.clickOnFilteredLanguage(language);
        console.log('Project Wizard, language is selected: ' + language);
        return await this.pause(300);
    }
}

module.exports = EditProjectDefaultLanguageStep;

