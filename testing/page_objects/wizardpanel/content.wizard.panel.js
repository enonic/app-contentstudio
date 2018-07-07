/**
 * Created on 5/30/2017.
 */
const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const contentBuilder = require('../../libs/content.builder');
const contentStepForm = require('./content.wizard.step.form');
const contentSettingsForm = require('./settings.wizard.step.form');
const contextWindow = require('./liveform/liveform.context.window');
const wizard = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
    displayNameInput: `//input[contains(@name,'displayName')]`,
    toolbar: `//div[contains(@id,'ContentWizardToolbar')]`,
    saveButton: `//button[contains(@id,'ActionButton') and child::span[text()='Save']]`,
    savedButton: `//button[contains(@id,'ActionButton') and child::span[text()='Saved']]`,
    deleteButton: `//button[contains(@id,'ActionButton') and child::span[text()='Delete...']]`,
    inspectionPanelToggler: "//button[contains(@id, 'TogglerButton') and contains(@class,'icon-cog')]",
    showComponentViewToggler: "//button[contains(@id, 'TogglerButton') and @title='Show Component View']",
    thumbnailUploader: "//div[contains(@id,'ThumbnailUploaderEl')]",
    controllerOptionFilterInput: "//input[contains(@id,'DropdownOptionFilterInput')]",
    liveEditFrame: "//iframe[contains(@class,'live-edit-frame')]",
    pageDescriptorViewer: `//div[contains(@id,'PageDescriptorViewer')]`,
};
const contentWizardPanel = Object.create(page, {

    displayNameInput: {
        get: function () {
            return `${wizard.container}` + `${wizard.displayNameInput}`;
        }
    },
    saveButton: {
        get: function () {
            return `${wizard.container}` + `${wizard.saveButton}`;
        }
    },
    savedButton: {
        get: function () {
            return `${wizard.container}` + `${wizard.savedButton}`;
        }
    },
    thumbnailUploader: {
        get: function () {
            return `${wizard.container}` + `${wizard.thumbnailUploader}`;
        }
    },
    deleteButton: {
        get: function () {
            return `${wizard.container}` + `${wizard.deleteButton}`;
        }
    },

    controllerOptionFilterInput: {
        get: function () {
            return `${elements.DROPDOWN_OPTION_FILTER_INPUT}`;
        }
    },
    //opens the ContextWindow with tabs:
    showInspectionPanelToggler: {
        get: function () {
            return `${wizard.container}` + `${wizard.toolbar}` + `${wizard.inspectionPanelToggler}`;
        }
    },
    showComponentViewToggler: {
        get: function () {
            return `${wizard.container}` + `${wizard.toolbar}` + `${wizard.showComponentViewToggler}`;
        }
    },
    waitForInspectionPanelTogglerVisible: {
        value: function (ms) {
            return this.waitForVisible(this.showInspectionPanelToggler, ms).catch(err => {
                this.saveScreenshot('err_open_inspection_panel');
                throw new Error('Inspection Panel is not opened in ' + ms + '  ' + err);
            })
        }
    },
    waitForShowComponentVewTogglerVisible: {
        value: function (ms) {
            return this.waitForVisible(this.showComponentViewToggler, ms).catch(err => {
                this.saveScreenshot('err_open_component_view');
                throw new Error('Component View is not opened in ' + ms + '  ' + err);
            })
        }
    },
    clickOnShowInspectionPanelToggler: {
        value: function () {
            return this.doClick(this.showInspectionPanelToggler).catch(err => {
                return this.doCatch('err_click_on_show_inspection_button', err);
            })
        }
    },
    clickOnShowComponentViewToggler: {
        value: function () {
            return this.doClick(this.showComponentViewToggler).catch(err => {
                return this.doCatch('err_click_on_show_component_view', err);
            }).pause(700);
        }
    },
    doOpenContextWindow: {
        value: function () {
            return this.clickOnShowInspectionPanelToggler().then(() => {
                return contextWindow.waitForOpened();
            });
        }
    },
    typeData: {
        value: function (content) {
            return this.typeDisplayName(content.displayName).then(() => {
                if (content.data != null) {
                    return contentStepForm.type(content.data, content.contentType);
                }
            }).then(() => {
                if (content.settings == null) {
                    return Promise.resolve();
                } else {
                    return this.typeSettings(content.settings);
                }
            })
        }
    },
    typeSettings: {
        value: function (settings) {
            return contentSettingsForm.filterOptionsAndSelectLanguage(settings.language);
        },
    },
    waitForOpened: {
        value: function () {
            return this.waitForVisible(this.displayNameInput, appConst.TIMEOUT_10).catch(err => {
                this.saveScreenshot(contentBuilder.generateRandomName('err_open_wizard'))
                throw new Error("Content wizard was not loaded! " + err);
            });
        }
    },
    waitForSaveButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.saveButton, appConst.TIMEOUT_3).catch(() => {
                return false;
            })
        }
    },
    waitForSaveButtonDisabled: {
        value: function () {
            return this.waitForDisabled(this.saveButton, appConst.TIMEOUT_3).catch(() => {
                return false;
            })
        }
    },
    waitForSaveButtonVisible: {
        value: function () {
            return this.waitForVisible(this.saveButton, appConst.TIMEOUT_3).catch(err => {
                return this.doCatch('err_save_button_vivsible', 'Save button is not visible ' + err);
            });
        }
    },
    waitForSavedButtonVisible: {
        value: function () {
            return this.waitForVisible(this.savedButton, appConst.TIMEOUT_3).catch(err => {
                return this.doCatch('err_saved_button_vivsible', err);
            });
        }
    },
    typeDisplayName: {
        value: function (displayName) {
            return this.typeTextInInput(this.displayNameInput, displayName);
        }
    },
    clearDisplayNameInput: {
        value: function () {
            return this.clearElement(this.displayNameInput).pause(500);
        }
    },
    isDisplayNameInputVisible: {
        value: function () {
            return this.isVisible(this.displayNameInput);
        }
    },
    waitAndClickOnSave: {
        value: function () {
            return this.waitForSaveButtonEnabled().then(result => {
                if (result) {
                    return this.doClick(this.saveButton);
                } else {
                    throw new Error('Save button is disabled');
                }
            }).catch(err => {
                this.saveScreenshot('err_click_on_save');
                throw new Error(`Error when click on Save button!` + err);
            }).then(() => {
                return this.waitForNotificationMessage();
            }).catch(err => {
                this.saveScreenshot('err_waiting_message');
                console.log('notification message: ' + err);
            })
        }
    },
    clickOnDelete: {
        value: function () {
            return this.doClick(this.deleteButton).catch(err => {
                console.log(err);
                this.saveScreenshot('err_delete_wizard');
                throw new Error('Error when Delete button has been clicked ' + err);
            });
        }
    },
    isContentInvalid: {
        value: function () {
            let selector = this.thumbnailUploader;
            return this.getBrowser().getAttribute(selector, 'class').then(result => {
                return result.includes("invalid");
            }).catch(err => {
                throw new Error('error when try to find the content validation state: ' + err);
            });
        }
    },
    waitUntilInvalidIconAppears: {
        value: function (displayName) {
            let selector = this.thumbnailUploader;
            return this.getBrowser().waitUntil(() => {
                return this.getBrowser().getAttribute(selector, 'class').then(result => {
                    return result.includes('invalid');
                });
            }, 2000).then(() => {
                return true;
            }).catch((err) => {
                throw new Error('content-wizard:invalid-icon was not found' + err);
            });
        }
    },
    waitUntilInvalidIconDisappears: {
        value: function (displayName) {
            let selector = this.thumbnailUploader;
            return this.getBrowser().waitUntil(() => {
                return this.getBrowser().getAttribute(selector, 'class').then(result => {
                    return !result.includes('invalid');
                })
            }, 2000).then(() => {
                return true;
            }).catch((err) => {
                throw new Error(err);
            });
        }
    },
    doCatch: {
        value: function (screenshotName, errString) {
            this.saveScreenshot(screenshotName);
            throw new Error(errString);
        }
    },
    switchToLiveEditFrame: {
        value: function () {
            return this.getBrowser().element(`${wizard.liveEditFrame}`).then(result => {
                return this.frame(result.value);
            });
        }
    },
    doFilterAndClickOnOption: {
        value: function (pageControllerDisplayName) {
            let optionSelector = elements.slickRowByDisplayName(`//div[contains(@id,'PageDescriptorDropdown')]`,
                pageControllerDisplayName);
            return this.waitForVisible(wizard.controllerOptionFilterInput, appConst.TIMEOUT_5).then(() => {
                return this.typeTextInInput(wizard.controllerOptionFilterInput, pageControllerDisplayName);
            }).then(() => {
                return this.waitForVisible(optionSelector, appConst.TIMEOUT_3);
            }).catch(err => {
                throw new Error('option was not found! ' + pageControllerDisplayName + ' ' + err);
            }).then(() => {
                return this.doClick(optionSelector).catch((err) => {
                    this.saveScreenshot('err_select_option');
                    throw new Error('option not found!' + pageControllerDisplayName);
                }).pause(500);
            });
        }
    },
    selectPageDescriptor: {
        value: function (pageControllerDisplayName) {
            return this.switchToLiveEditFrame().then(() => {
                return this.doFilterAndClickOnOption(pageControllerDisplayName);
            }).then(() => {
                return this.getBrowser().frameParent();
            }).then(() => {
                return this.waitForInspectionPanelTogglerVisible();
            })
        }
    },
    waitForControllerOptionFilterInputVisible: {
        value: function () {
            return this.switchToLiveEditFrame().then(() => {
                return this.waitForVisible(this.controllerOptionFilterInput, appConst.TIMEOUT_5);
            }).catch(err => {
                console.log(err);
                return this.getBrowser().frameParent().then(() => {
                    return false;
                })
            })
        }
    },
    waitForControllerOptionFilterInputNotVisible: {
        value: function () {
            return this.switchToLiveEditFrame().then(() => {
                return this.waitForNotVisible(this.controllerOptionFilterInput, appConst.TIMEOUT_3);
            }).catch(err => {
                console.log(err);
                return this.getBrowser().frameParent().then(() => {
                    return false;
                }).then(() => {
                    return this.getBrowser().frameParent();
                })
            })
        }
    },
    hotKeyDelete: {
        value: function () {
            return this.getBrowser().status().then(status => {
                if (status.value.os.name.toLowerCase().includes('wind') || status.value.os.name.toLowerCase().includes('linux')) {
                    return this.getBrowser().keys(['Control', 'Delete']);
                }
                if (status.value.os.name.toLowerCase().includes('mac')) {
                    return this.getBrowser().keys(['Command', 'Delete']);
                }
            })
        }
    },
    hotKeySave: {
        value: function () {
            return this.getBrowser().status().then(status => {
                if (status.value.os.name.toLowerCase().includes('wind') || status.value.os.name.toLowerCase().includes('linux')) {
                    return this.getBrowser().keys(['Control', 's']);
                }
                if (status.value.os.name.toLowerCase().includes('mac')) {
                    return this.getBrowser().keys(['Command', 's']);
                }
            })
        }
    },
    hotKeyPublish: {
        value: function () {
            return this.getBrowser().keys(['Control', 'Alt', 'p']);
        }
    },
});
module.exports = contentWizardPanel;


