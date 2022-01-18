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
    descriptionInput: `//textarea[contains(@name,'description')]`,
    applicationsSelectedOptions: "//div[contains(@id,'SiteConfiguratorSelectedOptionView')]",
    selectedAppByDisplayName: function (displayName) {
        return `//div[contains(@id,'SiteConfiguratorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    },
};

class SiteForm extends Page {

    get applicationsOptionsFilterInput() {
        return XPATH.wizardSteps + lib.FORM_VIEW + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get descriptionInput() {
        return lib.FORM_VIEW + XPATH.descriptionInput;
    }

    async type(siteData) {
        await this.typeDescription(siteData.description);
        if (siteData.applications) {
            await this.addApplications(siteData.applications);
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

    async filterOptionsAndSelectApplication(displayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            return await loaderComboBox.typeTextAndSelectOption(displayName, "//div[contains(@id,'SiteConfiguratorComboBox')]");
        } catch (err) {
            this.saveScreenshot(appConst.generateRandomName('err_option'));
            throw new Error('application selector :' + err);
        }
    }

    getAppDisplayNames() {
        let selector = XPATH.applicationsSelectedOptions + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    removeApplication(displayName) {
        let locator = XPATH.selectedAppByDisplayName(displayName) + lib.REMOVE_ICON;
        return this.clickOnElement(locator);
    }

    async openSiteConfiguratorDialog(displayName) {
        let selector = XPATH.selectedAppByDisplayName(displayName) + `//a[@class='edit']`;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        await this.clickOnElement(selector);
        let siteConfigDialog = new SiteConfigDialog();
        await siteConfigDialog.waitForDialogOpened();
        return await siteConfigDialog.pause(1000);
    }

    isSiteConfiguratorViewInvalid(displayName) {
        let selector = XPATH.selectedAppByDisplayName(displayName);
        return this.getAttribute(selector, 'class').then(result => {
            return result.includes("invalid");
        }).catch(err => {
            throw new Error('error when try to find selected application view: ' + err);
        });
    }

    waitUntilSiteConfiguratorViewValid(displayName) {
        let selector = XPATH.selectedAppByDisplayName(displayName);
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return !result.includes('invalid');
            })
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Site configurator should be valid"});
    }

    async swapApplications(sourceAppName, destinationAppName) {
        let sourceLocator = XPATH.selectedAppByDisplayName(sourceAppName);
        let destinationLocator = XPATH.selectedAppByDisplayName(destinationAppName);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destinationLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }
}

module.exports = SiteForm;


