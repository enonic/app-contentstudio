/**
 * Created on 14.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const SiteConfigDialog = require('./site.configurator.dialog');
const XPATH = {
    wizardSteps: `//div[contains(@id,'WizardStepsPanel')]`,
    editIcon: `//a[@class='edit']`,
    descriptionInput: `//textarea[contains(@name,'description')]`,
    applicationsSelectedOptions: "//div[contains(@id,'SiteConfiguratorSelectedOptionView')]",
    siteConfigComboboxDiv: "//div[contains(@id,'SiteConfiguratorComboBox')]",
    selectedAppByDisplayName: function (displayName) {
        return `//div[contains(@id,'SiteConfiguratorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    },
};

class SiteForm extends Page {

    get applicationsOptionsFilterInput() {
        return XPATH.wizardSteps + lib.FORM_VIEW + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get dropdownHandle() {
        return XPATH.wizardSteps + XPATH.siteConfigComboboxDiv + lib.DROP_DOWN_HANDLE;
    }

    get descriptionInput() {
        return lib.FORM_VIEW + XPATH.descriptionInput;
    }

    get helpTextInApplicationsSelector() {
        return lib.CONTENT_WIZARD_STEP_FORM +
               "//div[contains(@id,'InputView') and descendant::div[contains(@class,'application-configurator')]]//div[contains(@class,'help-text')]/p";
    }

    async type(siteData) {
        if (siteData.description) {
            await this.typeDescription(siteData.description);
        }
        if (siteData.applications) {
            await this.addApplications(siteData.applications);
            await this.waitForNotificationMessage();
        }
    }

    typeDescription(description) {
        return this.typeTextInInput(this.descriptionInput, description);
    }

    addApplications(appDisplayNames) {
        let result = Promise.resolve();
        appDisplayNames.forEach((displayName) => {
            result = result.then(() => {
                return this.filterOptionsAndSelectApplication(displayName)
            });
        });
        return result;
    }

    async clickOnDropdownHandle() {
        await this.waitForElementDisplayed(this.dropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.dropdownHandle);
        await this.pause(1000);
    }

    async clickOnCheckboxInDropdown(index) {
        let loaderComboBox = new LoaderComboBox();
        await loaderComboBox.clickOnCheckboxInDropdown(index, XPATH.siteConfigComboboxDiv);
    }

    async clickOnApplySelectionButtonInApplications() {
        let loaderComboBox = new LoaderComboBox();
        await loaderComboBox.clickOnApplyButton();
    }

    async filterOptionsAndSelectApplication(displayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            await loaderComboBox.typeTextAndSelectOption(displayName, "//div[contains(@id,'SiteConfiguratorComboBox')]");
            await this.pause(700);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_app_option');
            await this.saveScreenshot(screenshot);
            throw new Error('application selector, screenshot :' + screenshot + "  " + err);
        }
    }

    getSelectedAppDisplayNames() {
        let selector = XPATH.applicationsSelectedOptions + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    removeApplication(displayName) {
        let locator = XPATH.selectedAppByDisplayName(displayName) + lib.REMOVE_ICON;
        return this.clickOnElement(locator);
    }


    waitForEditApplicationIconNotDisplayed(displayName) {
        let locator = XPATH.selectedAppByDisplayName(displayName) + XPATH.editIcon;
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    waitForRemoveApplicationIconNotDisplayed(displayName) {
        let locator = XPATH.selectedAppByDisplayName(displayName) + lib.REMOVE_ICON;
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    async openSiteConfiguratorDialog(displayName) {
        let selector = XPATH.selectedAppByDisplayName(displayName) + XPATH.editIcon;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        await this.clickOnElement(selector);
        let siteConfigDialog = new SiteConfigDialog();
        await siteConfigDialog.waitForDialogOpened();
        return await siteConfigDialog.pause(1000);
    }

    async isSiteConfiguratorViewInvalid(displayName) {
        try {
            let selector = XPATH.selectedAppByDisplayName(displayName);
            let result = await this.getAttribute(selector, 'class');
            return result.includes('invalid');
        } catch (err) {
            throw new Error('error, site configurator validation ' + err);
        }
    }

    waitUntilSiteConfiguratorViewValid(displayName) {
        let selector = XPATH.selectedAppByDisplayName(displayName);
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return !result.includes('invalid');
            })
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Site configurator should be valid'});
    }

    async swapApplications(sourceAppName, destinationAppName) {
        let sourceLocator = XPATH.selectedAppByDisplayName(sourceAppName);
        let destinationLocator = XPATH.selectedAppByDisplayName(destinationAppName);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destinationLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    async getHelpTextsInApplicationsSelector() {
        await this.waitForElementDisplayed(this.helpTextInApplicationsSelector, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(this.helpTextInApplicationsSelector);
    }

    waitForHelpTextInApplicationsSelectorNotDisplayed() {
        return this.waitForElementNotDisplayed(this.helpTextInApplicationsSelector, appConst.mediumTimeout);
    }
}

module.exports = SiteForm;
