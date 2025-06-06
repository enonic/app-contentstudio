/**
 * Created on 14.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const SiteConfiguratorComboBox = require('../components/selectors/site.configurator.combobox');
const SiteConfigDialog = require('./site.configurator.dialog');
const XPATH = {
    wizardSteps: `//div[contains(@id,'WizardStepsPanel')]`,
    editIcon: `//a[@class='edit']`,
    descriptionInput: `//textarea[contains(@name,'description')]`,
    applicationsSelectedOptions: "//div[contains(@id,'SiteConfiguratorSelectedOptionView')]",
    siteConfigComboboxDiv: "//div[contains(@id,'SiteConfiguratorComboBox')]",
    selectedAppByDisplayName: (displayName) => {
        return `//div[contains(@id,'SiteConfiguratorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    },
};

class SiteForm extends Page {

    get applicationsOptionsFilterInput() {
        return XPATH.wizardSteps + lib.FORM_VIEW + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get dropdownHandle() {
        return XPATH.wizardSteps + XPATH.siteConfigComboboxDiv + lib.DROP_DOWN_HANDLE;
    }

    get descriptionInput() {
        return lib.FORM_VIEW + XPATH.descriptionInput;
    }

    get helpTextInApplicationsSelector() {
        return lib.CONTENT_WIZARD_STEP_FORM +
               "//div[contains(@id,'InputView') and descendant::div[contains(@class,'application-configurator')]]" + lib.HELP_TEXT.TEXT;
    }

    async type(siteData) {
        try {
            if (siteData.description) {
                await this.typeDescription(siteData.description);
            }
            if (siteData.applications) {
                await this.addApplications(siteData.applications);
                // Applications may not have controllers, so autosaving does not occur in this case
                // await this.waitForNotificationMessage();
            }
        } catch (err) {
            throw new Error("Error during creating site(Site form panel)  " + err);
        }
    }

    async typeDescription(description) {
        try {
            await this.waitForElementDisplayed(this.descriptionInput, appConst.mediumTimeout);
            return await this.typeTextInInput(this.descriptionInput, description);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_site_description');
            throw new Error("Error occurred in Site wizard, description text area, screenshot:" + screenshot + ' ' + err);
        }
    }

    async getTextInDescriptionTextArea() {
        try {
            await this.waitForElementDisplayed(this.descriptionInput, appConst.mediumTimeout);
            return await this.getTextInInput(this.descriptionInput);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_site_description');
            throw new Error("Error occurred in Site wizard, description text area, screenshot:" + screenshot + ' ' + err);
        }
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

    // Click on the dropdown handler in app-selector
    async clickOnDropdownHandle() {
        await this.waitForElementDisplayed(this.dropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.dropdownHandle);
        await this.pause(1000);
    }

    async clickOnCheckboxInDropdown(index) {
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox();
        await siteConfiguratorComboBox.clickOnCheckboxInDropdown(index, XPATH.siteConfigComboboxDiv);
    }

    async clickOnCheckboxInDropdownByDisplayName(displayName) {
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox();
        await siteConfiguratorComboBox.clickOnCheckboxInDropdownByDisplayName(displayName, XPATH.siteConfigComboboxDiv);
    }

    async waitForApplyAppSelectionButtonDisplayed() {
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox();
        await siteConfiguratorComboBox.waitForApplySelectionButtonDisplayed(XPATH.wizardSteps);
    }

    // Click on OK and apply the selected applications:
    async clickOnApplySelectionButtonInApplications() {
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox();
        await siteConfiguratorComboBox.clickOnApplySelectionButton();
    }

    async filterOptionsAndSelectApplication(displayName) {
        try {
            let siteConfiguratorComboBox = new SiteConfiguratorComboBox();
            await siteConfiguratorComboBox.selectFilteredApplicationAndClickOnApply(displayName, XPATH.wizardSteps);
            await this.pause(900);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_app_option');
            throw new Error(`Error occurred in Site wizard, application selector, screenshot : ${screenshot} ` + err);
        }
    }

    getSelectedAppDisplayNames() {
        let selector = XPATH.applicationsSelectedOptions + lib.H6_DISPLAY_NAME;
        return this.getTextInDisplayedElements(selector);
    }

    async removeApplication(displayName) {
        try {
            let locator = XPATH.selectedAppByDisplayName(displayName) + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_app_remove_icon');
            throw new Error(`Site wizard, application remove icon, screenshot :${screenshot}` + err);
        }
    }

    waitForEditApplicationIconNotDisplayed(displayName) {
        let locator = XPATH.selectedAppByDisplayName(displayName) + XPATH.editIcon;
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    async isApplicationUninstalled(displayName) {
        let locator = XPATH.selectedAppByDisplayName(displayName);
        let attr = await this.getAttribute(locator, 'class');
        return attr.includes('uninstalled');
    }

    waitForRemoveApplicationIconNotDisplayed(displayName) {
        let locator = XPATH.selectedAppByDisplayName(displayName) + lib.REMOVE_ICON;
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    async openSiteConfiguratorDialog(displayName) {
        try {
            let selector = XPATH.selectedAppByDisplayName(displayName) + XPATH.editIcon;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            let siteConfigDialog = new SiteConfigDialog();
            await siteConfigDialog.waitForDialogOpened();
            return await siteConfigDialog.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_open_site_configurator_dialog');
            throw new Error(`Error occurred in Site wizard, site configurator dialog, screenshot: ${screenshot} ` + err);
        }
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

    async waitForSiteConfiguratorSelectorDisabled() {
        return await this.waitForElementDisabled(this.applicationsOptionsFilterInput, appConst.mediumTimeout);
    }
}

module.exports = SiteForm;
