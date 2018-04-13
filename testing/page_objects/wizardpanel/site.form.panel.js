/**
 * Created on 14.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');
const siteConfigDialog = require('./site.configurator.dialog');
const form = {
    wizardSteps: `//div[contains(@id,'WizardStepsPanel')]`,
    descriptionInput: `//textarea[contains(@name,'description')]`,
    applicationsSelectedOptions: "//div[contains(@id,'SiteConfiguratorSelectedOptionView')]",
    selectedAppByDisplayName: function (displayName) {
        return `//div[contains(@id,'SiteConfiguratorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    },
}
var siteForm = Object.create(page, {

    applicationsOptionsFilterInput: {
        get: function () {
            return `${form.wizardSteps}`+`${elements.FORM_VIEW}`  + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    descriptionInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.descriptionInput}`;
        }
    },
    type: {
        value: function (siteData) {
            return this.typeDescription(siteData.description).then(()=> {
                return this.addApplications(siteData.applications);
            });
        }
    },
    typeDescription: {
        value: function (description) {
            return this.typeTextInInput(this.descriptionInput, description);
        }
    },
    addApplications: {
        value: function (appDisplayNames) {
            let result = Promise.resolve();
            appDisplayNames.forEach((displayName)=> {
                result = result.then(() => {
                    return this.filterOptionsAndSelectApplication(displayName)
                });
            });
            return result;
        }
    },
    filterOptionsAndSelectApplication: {
        value: function (displayName) {
            return this.typeTextInInput(this.applicationsOptionsFilterInput, displayName).then(()=> {
                return loaderComboBox.selectOption(displayName);
            }).catch(err=> {
                this.saveScreenshot(appConst.generateRandomName('err_option'));
                throw new Error('application selector :' + err);
            });
        }
    },
    getAppDisplayNames: {
        value: function () {
            let selector = `${form.applicationsSelectedOptions}` + `${elements.H6_DISPLAY_NAME}`;
            return this.getTextFromElements();
        }
    },
    removeApplication: {
        value: function (displayName) {
            let selector = `${form.selectedAppByDisplayName()}` + `${elements.REMOVE_ICON}`
            return this.doClick(selector);
        }
    },
    openSiteConfiguratorDialog: {
        value: function (displayName) {
            let selector = `${form.selectedAppByDisplayName(displayName)}` + `//a[@class='edit']`;
            return this.waitForVisible(selector,2000).then(()=>{
                return this.doClick(selector);
            }).then(()=> {
                return siteConfigDialog.waitForDialogVisible();
            })
        }
    },
    isSiteConfiguratorViewInvalid: {
        value: function (displayName) {
            let selector = `${form.selectedAppByDisplayName(displayName)}`;
            return this.getBrowser().getAttribute(selector, 'class').then(result=> {
                return result.includes("invalid");
            }).catch(err=> {
                throw new Error('error when try to find selected application view: ' + err);
            });
        }
    },
    waitUntilSiteConfiguratorViewValid: {
        value: function (displayName) {
            let selector = `${form.selectedAppByDisplayName(displayName)}`;
            return this.getBrowser().waitUntil(()=> {
                return this.getBrowser().getAttribute(selector, 'class').then(result=> {
                    return !result.includes('invalid');
                })
            }, 2000).then(()=> {
                return true;
            }).catch((err)=> {
                throw new Error(err);
            });
        }
    },
});
module.exports = siteForm;


