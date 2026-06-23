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
    editIcon: `//button[.//*[name()='svg' and contains(@class,'lucide-pencil')]]`,
    descriptionInput: `//textarea[contains(@name,'description')]`,
    siteConfigComboboxDiv: "//div[contains(@id,'SiteConfiguratorComboBox')]",
    removeAppIcon: `//button[.//*[name()='svg' and contains(@class,'lucide-x')]]`,
    // Selected application row in the SortableGridList (ItemLabel with the bold display-name span):
    selectedAppByDisplayName: (displayName) => {
        return `//div[@data-component='SiteConfiguratorInput']//div[@data-component='SortableGridList']/div[descendant::span[contains(@class,'font-semibold') and text()='${displayName}']]`
    },
    // FieldError shown below the SortableGridList when the app config is invalid:
    siteConfiguratorFieldError: (displayName) => {
        return `//div[@data-component='SiteConfiguratorInput'][descendant::span[text()='${displayName}']]//div[@data-component='FieldError']`;
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

    get baseUrlInput() {
        return COMMON.INPUTS.inputFieldByLabel('Base URL') + "//input";
    }

    get helpTextInBaseUrlInput() {
        return COMMON.INPUTS.inputFieldByLabel('Base URL') +
               "//div[@data-component='InputLabel']//div[contains(@class,'text-subtle')]";
    }

    get helpTextInApplicationsSelector() {
        return COMMON.INPUTS.inputFieldByLabel('Applications') +
               "//div[@data-component='InputLabel']//div[contains(@class,'text-subtle')]";
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

    async typeBaseUrl(baseUrl) {
        try {
            await this.waitForElementDisplayed(this.baseUrlInput);
            return await this.typeChars(this.baseUrlInput, baseUrl);
        } catch (err) {
            await this.handleError("Error occurred in Site wizard, base URL input", 'err_site_base_url', err);
        }
    }

    async getTextInBaseUrlInput() {
        try {
            await this.waitForElementDisplayed(this.baseUrlInput);
            return await this.getTextInInput(this.baseUrlInput);
        } catch (err) {
            await this.handleError("Error occurred in Site wizard, base URL input", 'err_site_base_url', err);
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
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox(XPATH.wizardSteps);
        await siteConfiguratorComboBox.clickOnDropdownHandle()
    }

    async clickOnCheckboxInDropdown(index) {
        let siteConfiguratorComboBox = new SiteConfiguratorComboBox(XPATH.wizardSteps);
        await siteConfiguratorComboBox.clickOnCheckboxInDropdown(index);
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
            let selector = XPATH.siteConfiguratorFieldError(displayName);
            return await this.isElementDisplayed(selector);
        } catch (err) {
            throw new Error('error, site configurator validation ' + err);
        }
    }

    waitUntilSiteConfiguratorViewValid(displayName) {
        let selector = XPATH.siteConfiguratorFieldError(displayName);
        return this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
    }

    async swapApplications(sourceAppName, destinationAppName) {
        try {
            const allItemsLocator =
                "//div[@data-component='SiteConfiguratorInput']//div[@data-component='SortableGridList']/div[@role='button']";
            const allItems = await this.findElements(allItemsLocator);
            let sourceIndex = -1;
            let destIndex = -1;
            for (let i = 0; i < allItems.length; i++) {
                const text = await allItems[i].getText();
                if (text.includes(sourceAppName)) {
                    sourceIndex = i;
                }
                if (text.includes(destinationAppName)) {
                    destIndex = i;
                }
            }
            if (sourceIndex === -1 || destIndex === -1) {
                throw new Error(`Application not found: source='${sourceAppName}', destination='${destinationAppName}'`);
            }
            await allItems[sourceIndex].click();
            await this.pause(200);
            await this.keys(' ');
            await this.pause(300);
            const steps = destIndex - sourceIndex;
            const arrowKey = steps > 0 ? 'ArrowDown' : 'ArrowUp';
            for (let i = 0; i < Math.abs(steps); i++) {
                await this.keys(arrowKey);
                await this.pause(100);
            }
            await this.keys(' ');
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_swap_applications');
            throw new Error(`Error during applications swap, screenshot: ${screenshot}. ` + err);
        }
    }

    async getHelpTextsInApplicationsSelector() {
        await this.waitForElementDisplayed(this.helpTextInApplicationsSelector);
        return await this.getTextInDisplayedElements(this.helpTextInApplicationsSelector);
    }

    async getHelpTextsInBaseUrl() {
        await this.waitForElementDisplayed(this.helpTextInBaseUrlInput);
        return await this.getTextInDisplayedElements(this.helpTextInBaseUrlInput);
    }

    waitForHelpTextInApplicationsSelectorNotDisplayed() {
        return this.waitForElementNotDisplayed(this.helpTextInApplicationsSelector);
    }

    async waitForSiteConfiguratorSelectorDisabled() {
        return await this.waitForElementDisabled(this.applicationsOptionsFilterInput);
    }
}

module.exports = SiteForm;
