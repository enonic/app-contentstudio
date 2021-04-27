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

    removeApplication() {
        let selector = XPATH.selectedAppByDisplayName() + lib.REMOVE_ICON;
        return this.clickOnElement(selector);
    }

    openSiteConfiguratorDialog(displayName) {
        let selector = XPATH.selectedAppByDisplayName(displayName) + `//a[@class='edit']`;
        return this.waitForElementDisplayed(selector, 2000).then(() => {
            return this.clickOnElement(selector);
        }).then(() => {
            let siteConfigDialog = new SiteConfigDialog();
            return siteConfigDialog.waitForDialogOpened();
        })
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
}

module.exports = SiteForm;


