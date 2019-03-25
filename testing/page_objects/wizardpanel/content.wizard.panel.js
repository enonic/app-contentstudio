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
const detailsPanel = require('./details/wizard.details.panel');
const wizard = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
    displayNameInput: `//input[contains(@name,'displayName')]`,
    toolbar: `//div[contains(@id,'ContentWizardToolbar')]`,
    toolbarPublish: "//div[contains(@id,'ContentWizardToolbarPublishControls')]",
    saveButton: `//button[contains(@id,'ActionButton') and child::span[text()='Save']]`,
    savedButton: `//button[contains(@id,'ActionButton') and child::span[text()='Saved']]`,
    deleteButton: `//button[contains(@id,'ActionButton') and child::span[text()='Delete...']]`,
    publishButton: "//button[contains(@id,'ActionButton') and child::span[text()='Publish...']]",
    unpublishMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Unpublish']",
    inspectionPanelToggler: "//button[contains(@id, 'TogglerButton') and contains(@class,'icon-cog')]",
    showComponentViewToggler: "//button[contains(@id, 'TogglerButton') and @title='Show Component View']",
    thumbnailUploader: "//div[contains(@id,'ThumbnailUploaderEl')]",
    controllerOptionFilterInput: "//input[contains(@id,'DropdownOptionFilterInput')]",
    liveEditFrame: "//iframe[contains(@class,'live-edit-frame')]",
    pageDescriptorViewer: `//div[contains(@id,'PageDescriptorViewer')]`,
    accessTabBarItem: `//li[contains(@id,'ContentTabBarItem') and @title='Access']`,
    scheduleTabBarItem: `//li[contains(@id,'ContentTabBarItem') and @title='Schedule']`,
    scheduleForm: "//div[contains(@id,'ScheduleWizardStepForm')]",
    detailsPanelToggleButton: `//button[contains(@id,'NonMobileContextPanelToggleButton')]`,
    itemViewContextMenu: `//div[contains(@id,'ItemViewContextMenu')]`,
    xDataToggler: `//div[contains(@id,'WizardStepsPanel')]//div[@class='x-data-toggler']`,
    stepNavigatorToolbar: `//ul[contains(@id,'wizard.WizardStepNavigator')]`,
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    author: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'author')]`,
    wizardStepByName:
        name => `//ul[contains(@id,'wizard.WizardStepNavigator')]//li[child::a[text()='${name}']]`,
    wizardStepByTitle:
        name => `//ul[contains(@id,'wizard.WizardStepNavigator')]//li[contains(@id,'ContentTabBarItem') and @title='${name}']`,
    xDataTogglerByName:
        name => `//div[contains(@id,'WizardStepsPanel')]//div[@class='x-data-toggler' and preceding-sibling::span[contains(.,'${name}')]]`,
};
const contentWizardPanel = Object.create(page, {

    displayNameInput: {
        get: function () {
            return `${wizard.container}` + `${wizard.displayNameInput}`;
        }
    },
    detailsPanelToggleButton: {
        get: function () {
            return `${wizard.container}` + `${wizard.detailsPanelToggleButton}`;
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
    publishButton: {
        get: function () {
            return `${wizard.container}` + `${wizard.publishButton}`;
        }
    },
    publishDropDownHandle: {
        get: function () {
            return `${wizard.toolbarPublish}` + elements.DROP_DOWN_HANDLE;
        }
    },
    unpublishMenuItem: {
        get: function () {
            return `${wizard.toolbarPublish}` + `${wizard.unpublishMenuItem}`;
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
        value: function () {
            return this.waitForVisible(this.showInspectionPanelToggler, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot('err_open_inspection_panel');
                throw new Error('Inspection Panel is not opened in ' + appConst.TIMEOUT_3 + '  ' + err);
            })
        }
    },
    waitForContextWindowVisible: {
        value: function () {
            return contextWindow.waitForOpened();
        }
    },
    waitForScheduleFormVisible: {
        value: function () {
            return this.waitForVisible(wizard.scheduleForm, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('schedule_form_should_not_be_visible');
                return false;
            })
        }
    },
    waitForScheduleFormNotVisible: {
        value: function () {
            return this.waitForNotVisible(wizard.scheduleForm, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('schedule_form_should_not_be_visible');
                return false;
            })
        }
    },
    waitForShowComponentVewTogglerVisible: {
        value: function () {
            return this.waitForVisible(this.showComponentViewToggler, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_component_view');
                throw new Error('Component View toggler is not visible in ' + 2 + '  ' + err);
            })
        }
    },
    // opens Details Panel if it is not loaded
    openDetailsPanel: {
        value: function () {
            return detailsPanel.isDetailsPanelLoaded().then(result => {
                if (!result) {
                    return this.doClick(this.detailsPanelToggleButton).catch(err => {
                        throw new Error("Error when trying to open Details Panel in Wizard");
                    }).then(() => {
                        return detailsPanel.waitForDetailsPanelLoaded();
                    })
                } else {
                    console.log("Content wizard is opened and Details Panel is loaded");
                }
            })
        }
    },
    waitForXdataTogglerVisible: {
        value: function () {
            return this.waitForVisible(wizard.xDataToggler, appConst.TIMEOUT_1).catch(err => {
                this.saveScreenshot("err_x-data_toogler");
                throw new Error("x-data toggler is not visible on the wizard page");
            })
        }
    },
    waitForWizardStepPresent: {
        value: function (stepName) {
            let stepXpath = wizard.wizardStepByName(stepName);
            return this.waitForVisible(stepXpath, appConst.TIMEOUT_2).catch(err => {
                console.log("Wizard step is not visible: " + err);
                return false;
            })
        }
    },
    isWizardStepByTitlePresent: {
        value: function (title) {
            let stepXpath = wizard.wizardStepByTitle(title);
            return this.waitForVisible(stepXpath, appConst.TIMEOUT_1).catch(err => {
                console.log("Wizard step is not visible: " + title);
                return false;
            })
        }
    },
    clickOnWizardStep: {
        value: function (title) {
            let stepXpath = wizard.wizardStepByTitle(title);
            return this.doClick(stepXpath).catch(err => {
                throw new Error("Error when clicking on the Step: " + title);
            }).pause(300);
        }
    },
    waitForWizardStepByTitleNotVisible: {
        value: function (title) {
            let stepXpath = wizard.wizardStepByTitle(title);
            return this.waitForNotVisible(stepXpath, appConst.TIMEOUT_1).catch(err => {
                console.log("Wizard step is not visible: " + title);
                return false;
            })
        }
    },
    clickOnXdataToggler: {
        value: function () {
            return this.doClick(wizard.xDataToggler).catch(err => {
                return this.doCatch('err_click_on_xdata_toggler', err);
            })
        }
    },
    clickOnXdataTogglerByName: {
        value: function (name) {
            return this.doClick(wizard.xDataTogglerByName(name)).catch(err => {
                throw new Error("Error on clickin on toogler " + name + " " + err);
            }).pause(400);
        }
    },
    //Gets titles of all x-data forms
    getXdataTitles: {
        value: function () {
            let selector = "//div[contains(@id,'PanelStripHeader') and child::div[@class='x-data-toggler']]/span"
            return this.getText(selector).catch(err => {
                throw new Error("Error when getting title from x-data " + err);
            }).then(result => {
                return [].concat(result);
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
            return this.waitForVisible(this.showComponentViewToggler, appConst.TIMEOUT_2).then(() => {
                return this.doClick(this.showComponentViewToggler);
            }).catch(err => {
                return this.doCatch('err_click_on_show_component_view', err);
            }).pause(700);
        }
    },
    clickOnAccessTabBarItem: {
        value: function () {
            return this.doClick(wizard.accessTabBarItem).catch(err => {
                return this.doCatch('err_clicking_on_access_tabbar', err);
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
            return this.waitForVisible(this.displayNameInput, appConst.TIMEOUT_2).catch(err => {
                return this.clickOnMinimizeEditIcon();
            }).pause(700).then(() => {
                return this.typeDisplayName(content.displayName);
            }).then(() => {
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
            return this.waitForVisible(this.deleteButton, appConst.TIMEOUT_10).catch(err => {
                this.saveScreenshot(contentBuilder.generateRandomName('err_open_wizard'));
                throw new Error("Content wizard was not loaded! " + err);
            }).then(() => {
                return this.waitForSpinnerNotVisible(appConst.TIMEOUT_3);
            });
        }
    },
    //return false if Save button is disabled
    waitForSaveButtonEnabled: {
        value: function () {
            return this.waitForEnabled(this.saveButton, appConst.TIMEOUT_3).catch(err => {
                console.log("Wizard, Save button " + err);
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
                this.saveScreenshot('err_saved_button_not_visible');
                throw new Error("Saved button is not visible in 3 seconds" + err);
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
                    throw new Error('Save button is disabled! ');
                }
            });
        }
    },
    clickOnDelete: {
        value: function () {
            return this.doClick(this.deleteButton).catch(err => {
                this.saveScreenshot('err_delete_wizard');
                throw new Error('Error when Delete button has been clicked ' + err);
            });
        }
    },
    clickOnPublishButton: {
        value: function () {
            return this.doClick(this.publishButton).catch(err => {
                this.saveScreenshot('err_when_click_on_publish_button');
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
            }).catch(err => {
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
    doUnlockLiveEditor: {
        value: function () {
            return this.doOpenItemViewContextMenu().then(() => {
                return this.clickOnCustomizeMenuItem();
            })
        }
    },
    doOpenItemViewContextMenu: {
        value: function () {
            let selector = `//div[contains(@id,'Panel') and contains(@class,'frame-container')]`;
            return this.waitForVisible(selector, appConst.TIMEOUT_3).then(() => {
                return this.doClick(selector);
            }).then(() => {
                return this.switchToLiveEditFrame();
            }).then(() => {
                return this.waitForVisible(wizard.itemViewContextMenu, appConst.TIMEOUT_2);
            }).catch(err => {
                this.saveScreenshot("err_customize_menu_item");
                throw  new Error(`'Customize Page' menu item is not displayed` + err);
            });
        }
    },
    // wait for 'Customize Page' context menu item
    clickOnCustomizeMenuItem: {
        value: function () {
            let selector = wizard.itemViewContextMenu + "//dl//dt[text()='Customize Page']";
            return this.doClick(selector).pause(700);
        }
    },
    switchToLiveEditFrame: {
        value: function () {
            return this.getBrowser().element(`${wizard.liveEditFrame}`).then(result => {
                return this.frame(result.value);
            });
        }
    },
    doFilterControllersAndClickOnOption: {
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
                return this.doClick(optionSelector).catch(err => {
                    this.saveScreenshot('err_select_option');
                    throw new Error('option not found!' + pageControllerDisplayName+ " "+ err);
                }).pause(500);
            });
        }
    },
    selectPageDescriptor: {
        value: function (pageControllerDisplayName) {
            return this.switchToLiveEditFrame().then(() => {
                return this.doFilterControllersAndClickOnOption(pageControllerDisplayName);
            }).pause(700).then(() => {
                return this.getBrowser().frameParent();
            }).then(() => {
                this.saveScreenshot('controller_selected');
                return this.waitForContextWindowVisible();
            })
        }
    },
    switchToMainFrame: {
        value: function () {
            return this.getBrowser().frameParent();
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
                return this.waitForNotVisible(this.controllerOptionFilterInput, appConst.TIMEOUT_5);
            }).catch(err => {
                console.log(err);
                return this.getBrowser().frameParent().then(() => {
                    return false;
                });
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
    getContentStatus: {
        value: function () {
            return this.getDisplayedElements(wizard.container + wizard.status).then(result => {
                return this.getBrowser().elementIdText(result[0].ELEMENT);
            }).then(result => {
                return result.value;
            }).catch(err => {
                this.saveScreenshot('err_wizard_status');
                throw Error('Error when getting of content status.');
            })
        }
    },
    getContentAuthor: {
        value: function () {
            return this.getDisplayedElements(wizard.container + wizard.author).then(result => {
                return this.getBrowser().elementIdText(result[0].ELEMENT);
            }).then(result => {
                return result.value;
            }).catch(err => {
                this.saveScreenshot('err_wizard_author');
                throw Error('Error when getting of author for content.');
            })
        }
    },
    clickOnPublishDropdownHandle: {
        value: function () {
            return this.waitForVisible(this.publishDropDownHandle, appConst.TIMEOUT_3).then(() => {
                return this.doClick(this.publishDropDownHandle);
            }).catch(err => {
                if (err.type === "WaitUntilTimeoutError") {
                    throw new Error("Publish dropdown handle is not visible!" + err);
                }
                throw new Error("Error when clicking on Publish dropdown handle " + err);
            }).pause(300);
        }
    },
    clickOnUnpublishmenuItem: {
        value: function () {
            return this.clickOnPublishDropdownHandle().then(() => {
                return this.waitForVisible(this.unpublishMenuItem, appConst.TIMEOUT_3);
            }).then(() => {
                return this.doClick(this.unpublishMenuItem);
            }).catch(err => {
                throw new Error("Error when unpublishing the contentS! " + err);
            }).pause(300);
        }
    },
    clickOnMinimizeEditIcon: {
        value: function () {
            let minimizeEditIcon = wizard.container + "//div[@class='minimize-edit']";
            return this.doClick(minimizeEditIcon).catch(err => {
                return this.doCatch('err_click_on_minimize_icon', err);
            }).pause(300);
        }
    },
});
module.exports = contentWizardPanel;


