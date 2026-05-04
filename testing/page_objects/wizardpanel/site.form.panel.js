/**
 * Created on 14.12.2017.
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const SiteConfiguratorComboBox = require('../components/selectors/site.configurator.combobox');
const SiteConfigDialog = require('./site.configurator.dialog');

const XPATH = {
    wizardSteps: `//div[contains(@id,'ContentWizardTabsToolbar')]`,
    editIcon: `//a[@class='edit']`,
    descriptionInput: `//textarea[contains(@name,'description')]`,
    siteConfigComboboxDiv: "//div[contains(@id,'SiteConfiguratorComboBox')]",
    removeAppIcon: `//button[.//*[name()='svg' and contains(@class,'lucide-x')]]`,
    selectedAppByDisplayName: (displayName) => {
        return `//div[@data-component='SiteConfiguratorInput']//div[@role='button' and descendant::span[text()='${displayName}']]`
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
        return COMMON.INPUTS.inputFieldByLabel('Description') + "//textarea";
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
            throw new Error("Error in Site form panel!" + err);
        }
    }

    async typeDescription(description) {
        try {
            await this.waitForElementDisplayed(this.descriptionInput);
            return await this.typeChars(this.descriptionInput, description);
        } catch (err) {
            await this.handleError("Error occurred in Site wizard, description text area", 'err_site_description', err);
        }
    }

    async getTextInDescriptionTextArea() {
        try {
            await this.waitForElementDisplayed(this.descriptionInput);
            return await this.getTextInInput(this.descriptionInput);
        } catch (err) {
            await this.handleError("Error occurred in Site wizard, description text area", 'err_site_description', err);
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
        await this.waitForElementDisplayed(this.dropdownHandle);
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
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox(XPATH.wizardSteps);
        await siteConfiguratorComboBox.waitForApplySelectionButtonDisplayed();
    }

    // Click on Apply selected applications:
    async clickOnApplySelectionButtonInApplications() {
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox(XPATH.wizardSteps);
        await siteConfiguratorComboBox.clickOnApplySelectionButton();
    }

    async filterOptionsAndSelectApplication(displayName) {
        try {
            let siteConfiguratorComboBox = new SiteConfiguratorComboBox(XPATH.wizardSteps);
            await siteConfiguratorComboBox.selectFilteredApplicationAndClickOnApply(displayName );
            await this.pause(100);
        } catch (err) {
            await this.handleError(`Site wizard, application selector, tried to select application: ${displayName}`, 'err_select_app', err);
        }
    }

    async getSelectedAppDisplayNames() {
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox(XPATH.wizardSteps);
        return await siteConfiguratorComboBox.getSelectedOptionsDisplayName();
    }

    async removeApplication(displayName) {
        try {
            let locator = XPATH.selectedAppByDisplayName(displayName) + XPATH.removeAppIcon;
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
        let locator = XPATH.selectedAppByDisplayName(displayName) + XPATH.removeAppIcon;
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
        try {
            let sourceLocator = XPATH.selectedAppByDisplayName(sourceAppName);
            let destinationLocator = XPATH.selectedAppByDisplayName(destinationAppName);
            let source = await this.findElement(sourceLocator);
            let destination = await this.findElement(destinationLocator);
            let sourceLocation = await source.getLocation();
            let sourceSize = await source.getSize();
            let destinationLocation = await destination.getLocation();
            let destinationSize = await destination.getSize();
            const sourceCenterX = Math.round(sourceLocation.x + sourceSize.width / 2);
            const sourceCenterY = Math.round(sourceLocation.y + sourceSize.height / 2);
            const destCenterX = Math.round(destinationLocation.x + destinationSize.width / 2);
            const destCenterY = Math.round(destinationLocation.y + destinationSize.height / 2);
            await this.browser.performActions([{
                type: 'pointer',
                id: 'mouse',
                parameters: {pointerType: 'mouse'},
                actions: [
                    {type: 'pointerMove', origin: 'viewport', x: sourceCenterX, y: sourceCenterY},
                    {type: 'pointerDown', button: 0},
                    {type: 'pause', duration: 300},
                    {type: 'pointerMove', origin: 'viewport', x: destCenterX, y: destCenterY, duration: 800},
                    {type: 'pause', duration: 200},
                    {type: 'pointerUp', button: 0}
                ]
            }]);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_swap_applications');
            throw new Error(`Error during applications swap, screenshot: ${screenshot}. ` + err);
        }
    }

    async getHelpTextsInApplicationsSelector() {
        await this.waitForElementDisplayed(this.helpTextInApplicationsSelector);
        return await this.getTextInDisplayedElements(this.helpTextInApplicationsSelector);
    }

    waitForHelpTextInApplicationsSelectorNotDisplayed() {
        return this.waitForElementNotDisplayed(this.helpTextInApplicationsSelector);
    }

    async waitForSiteConfiguratorSelectorDisabled() {
        return await this.waitForElementDisabled(this.applicationsOptionsFilterInput);
    }
}

module.exports = SiteForm;
