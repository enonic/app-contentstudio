/**
 * Created on 5/30/2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const contentBuilder = require('../../libs/content.builder');
const ContentStepForm = require('./content.wizard.step.form');
const ContentSettingsForm = require('./settings.wizard.step.form');
const ContextWindow = require('./liveform/liveform.context.window');
const DetailsPanel = require('./details/wizard.details.panel');
const XPATH = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
    displayNameInput: `//input[contains(@name,'displayName')]`,
    toolbar: `//div[contains(@id,'ContentWizardToolbar')]`,
    toolbarPublish: "//div[contains(@id,'ContentWizardToolbarPublishControls')]",
    saveButton: `//button[contains(@id,'ActionButton') and child::span[text()='Save']]`,
    savedButton: `//button[contains(@id,'ActionButton') and child::span[text()='Saved']]`,
    savingButton: `//button[contains(@id,'ActionButton') and child::span[text()='Saving...']]`,
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

class ContentWizardPanel extends Page {

    get displayNameInput() {
        return XPATH.container + XPATH.displayNameInput;
    }

    get detailsPanelToggleButton() {
        return XPATH.container + XPATH.detailsPanelToggleButton;
    }

    get saveButton() {
        return XPATH.container + XPATH.saveButton;
    }

    get savedButton() {
        return XPATH.container + XPATH.savedButton;
    }

    get savingButton() {
        return XPATH.container + XPATH.savingButton;
    }

    get publishButton() {
        return XPATH.container + XPATH.publishButton;
    }

    get publishDropDownHandle() {
        return XPATH.toolbarPublish + lib.DROP_DOWN_HANDLE;
    }

    get unpublishMenuItem() {
        return XPATH.toolbarPublish + XPATH.unpublishMenuItem;
    }

    get thumbnailUploader() {
        return XPATH.container + XPATH.thumbnailUploader;
    }

    get deleteButton() {
        return XPATH.container + XPATH.deleteButton;
    }

    get controllerOptionFilterInput() {
        return lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

//opens the ContextWindow with tabs:
    get showInspectionPanelToggler() {
        return XPATH.container + XPATH.toolbar + XPATH.inspectionPanelToggler;
    }

    get showComponentViewToggler() {
        return XPATH.container + XPATH.toolbar + XPATH.showComponentViewToggler;
    }

    waitForInspectionPanelTogglerVisible() {
        return this.waitForElementDisplayed(this.showInspectionPanelToggler, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_open_inspection_panel');
            throw new Error('Inspection Panel is not opened in ' + appConst.TIMEOUT_3 + '  ' + err);
        })
    }

    waitForContextWindowVisible() {
        let contextWindow = new ContextWindow();
        return contextWindow.waitForOpened();
    }

    waitForScheduleFormVisible() {
        return this.waitForElementDisplayed(XPATH.scheduleForm, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('schedule_form_should_not_be_visible');
            return false;
        })
    }

    waitForScheduleFormNotVisible() {
        return this.waitForElementNotDisplayed(XPATH.scheduleForm, appConst.TIMEOUT_2);
    }

    waitForShowComponentVewTogglerVisible() {
        return this.waitForElementDisplayed(this.showComponentViewToggler, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('err_open_component_view');
            throw new Error('Component View toggler is not visible in ' + 2 + '  ' + err);
        })
    }

    // opens Details Panel if it is not loaded
    openDetailsPanel() {
        let detailsPanel = new DetailsPanel();
        return detailsPanel.isDetailsPanelLoaded().then(result => {
            if (!result) {
                return this.clickOnElement(this.detailsPanelToggleButton).catch(err => {
                    throw new Error("Error when trying to open Details Panel in Wizard");
                }).then(() => {
                    return detailsPanel.waitForDetailsPanelLoaded();
                }).then(() => {
                    return this.pause(300);
                })
            } else {
                console.log("Content wizard is opened and Details Panel is loaded");
            }
        })
    }

    waitForXdataTogglerVisible() {
        return this.waitForElementDisplayed(XPATH.xDataToggler, appConst.TIMEOUT_1).catch(err => {
            this.saveScreenshot("err_x-data_toogler");
            throw new Error("x-data toggler is not visible on the wizard page");
        })
    }

    waitForWizardStepPresent(stepName) {
        let stepXpath = XPATH.wizardStepByName(stepName);
        return this.waitForElementDisplayed(stepXpath, appConst.TIMEOUT_2).catch(err => {
            console.log("Wizard step is not visible: " + err);
            return false;
        })
    }

    isWizardStepByTitlePresent(title) {
        let stepXpath = XPATH.wizardStepByTitle(title);
        return this.waitForElementDisplayed(stepXpath, appConst.TIMEOUT_1).catch(err => {
            console.log("Wizard step is not visible: " + title);
            return false;
        })
    }

    async clickOnWizardStep(title) {
        let stepXpath = XPATH.wizardStepByTitle(title);
        await this.clickOnElement(stepXpath);
        return await this.pause(300);
    }

    waitForWizardStepByTitleNotVisible(title) {
        let stepXpath = XPATH.wizardStepByTitle(title);
        return this.waitForElementNotDisplayed(stepXpath, appConst.TIMEOUT_1).catch(err => {
            console.log("Wizard step is not visible: " + title);
            return false;
        })
    }

    clickOnXdataToggler() {
        return this.clickOnElement(XPATH.xDataToggler).catch(err => {
            this.saveScreenshot('err_click_on_xdata_toggler');
            throw new Error("Error when clicking on x-data toggler " + err);
        })
    }

    async clickOnXdataTogglerByName(name) {
        await this.clickOnElement(XPATH.xDataTogglerByName(name));
        return await this.pause(400);
    }

//Gets titles of all x-data forms
    getXdataTitles() {
        let selector = "//div[contains(@id,'PanelStripHeader') and child::div[@class='x-data-toggler']]/span"
        return this.getTextInElements(selector).catch(err => {
            throw new Error("Error when getting title from x-data " + err);
        })
    }

    clickOnShowInspectionPanelToggler() {
        return this.clickOnElement(this.showInspectionPanelToggler).catch(err => {
            return this.saveScreenshot('err_click_on_show_inspection_button');
            throw new Error("Error when clicking on Inspection Panel Toggler " + err);
        })
    }

    clickOnShowComponentViewToggler() {
        return this.waitForElementDisplayed(this.showComponentViewToggler, appConst.TIMEOUT_2).then(() => {
            return this.clickOnElement(this.showComponentViewToggler);
        }).catch(err => {
            this.saveScreenshot('err_click_on_show_component_view');
            throw new Error("Error when clicking on 'Show Component View!'" + err);
        }).then(() => {
            return this.pause(500);
        });
    }

    async clickOnAccessTabBarItem() {
        await this.clickOnElement(XPATH.accessTabBarItem)
        return await this.pause(700);
    }

    waitForOpened() {
        return this.waitForElementDisplayed(this.deleteButton, appConst.TIMEOUT_10).catch(err => {
            this.saveScreenshot(contentBuilder.generateRandomName('err_open_wizard'));
            throw new Error("Content wizard was not loaded! " + err);
        }).then(() => {
            return this.waitForSpinnerNotVisible(appConst.TIMEOUT_3);
        });
    }

//return false if Save button is disabled
    waitForSaveButtonEnabled() {
        return this.waitForSaveButtonVisible().then(() => {
            return this.waitForElementEnabled(this.saveButton, appConst.TIMEOUT_3)
        }).catch(err => {
            return false;
        })
    }

    waitForSaveButtonDisabled() {
        return this.waitForElementDisabled(this.saveButton, appConst.TIMEOUT_3).catch((err) => {
            throw new Error("Content Wizard - " + err);
        })
    }

    waitForSaveButtonVisible() {
        return this.waitForElementDisplayed(this.saveButton, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_save_button');
            throw new Error('Save button is not visible ' + err);
        });
    }

    waitForSavedButtonVisible() {
        return this.waitForElementDisplayed(this.savedButton, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_saved_button_not_visible');
            throw new Error("Saved button is not visible in 3 seconds" + err);
        });
    }

    switchToLiveEditFrame() {
        return this.switchToFrame(XPATH.liveEditFrame);
    }

    doOpenContextWindow() {
        let contextWindow = new ContextWindow();
        return this.clickOnShowInspectionPanelToggler().then(() => {
            return contextWindow.waitForOpened();
        });
    }

    typeDisplayName(displayName) {
        return this.typeTextInInput(this.displayNameInput, displayName);
    }

    clearDisplayNameInput() {
        return this.clearInputText(this.displayNameInput);
    }

    async waitAndClickOnSave() {
        await this.waitForSaveButtonEnabled();
        await this.clickOnElement(this.saveButton);
        await this.waitForSavingButtonNotVisible();
        return await this.pause(1200);
    }

    waitForSavingButtonNotVisible() {
        return this.waitForElementNotDisplayed(this.savingButton, appConst.TIMEOUT_7);
    }

    clickOnDelete() {
        return this.clickOnElement(this.deleteButton).catch(err => {
            this.saveScreenshot('err_delete_wizard');
            throw new Error('Error when Delete button has been clicked ' + err);
        });
    }

    clickOnPublishButton() {
        return this.waitForElementDisplayed(this.publishButton, appConst.TIMEOUT_3).then(() => {
            return this.waitForElementEnabled(this.publishButton, appConst.TIMEOUT_3);
        }).then(() => {
            return this.clickOnElement(this.publishButton)
        }).catch(err => {
            this.saveScreenshot('err_when_click_on_publish_button');
            throw new Error('Error when Publish button has been clicked ' + err);
        });
    }

    isContentInvalid() {
        let selector = this.thumbnailUploader;
        return this.getAttribute(selector, 'class').then(result => {
            return result.includes("invalid");
        }).catch(err => {
            throw new Error('Validation Error: error when try to find the content validation state: ' + err);
        });
    }

    waitUntilInvalidIconAppears(displayName) {
        let selector = this.thumbnailUploader;
        return this.waitUntilInvalid(selector).catch(err => {
            this.saveScreenshot('err_wizard_validation_icon1');
            throw new Error('Validation Error: invalid-icon did not appear in content-wizard after 2 seconds' + err);
        });
    }

    waitUntilInvalidIconDisappears(displayName) {
        let selector = this.thumbnailUploader;
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return !result.includes('invalid');
            })
        }, 2000).catch(err => {
            this.saveScreenshot('err_wizard_validation_icon2');
            throw new Error("Validation Error: Red icon is displayed in the wizard after 2 seconds" + err);
        });
    }

    typeSettings(settings) {
        let contentSettingsForm = new ContentSettingsForm();
        return contentSettingsForm.filterOptionsAndSelectLanguage(settings.language);
    }

    doUnlockLiveEditor() {
        return this.doOpenItemViewContextMenu().then(() => {
            return this.clickOnCustomizeMenuItem();
        })
    }

    doOpenItemViewContextMenu() {
        let selector = `//div[contains(@id,'Panel') and contains(@class,'frame-container')]`;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3).then(() => {
            return this.clickOnElement(selector);
        }).then(() => {
            return this.switchToLiveEditFrame();
        }).then(() => {
            return this.waitForElementDisplayed(XPATH.itemViewContextMenu, appConst.TIMEOUT_2);
        }).catch(err => {
            this.saveScreenshot("err_customize_menu_item");
            throw  new Error(`'Customize Page' menu item is not displayed` + err);
        });
    }

    // wait for 'Customize Page' context menu item
    async clickOnCustomizeMenuItem() {
        let selector = XPATH.itemViewContextMenu + "//dl//dt[text()='Customize Page']";
        await this.clickOnElement(selector);
        return await this.pause(700);
    }

    doFilterControllersAndClickOnOption(pageControllerDisplayName) {
        let optionSelector = lib.slickRowByDisplayName(`//div[contains(@id,'PageDescriptorDropdown')]`,
            pageControllerDisplayName);
        return this.waitForElementDisplayed(XPATH.controllerOptionFilterInput, appConst.TIMEOUT_5).then(() => {
            return this.typeTextInInput(XPATH.controllerOptionFilterInput, pageControllerDisplayName);
        }).then(() => {
            return this.waitForElementDisplayed(optionSelector, appConst.TIMEOUT_3);
        }).then(() => {
            return this.clickOnElement(optionSelector);
        }).catch(err => {
            this.saveScreenshot('err_select_controller');
            throw new Error('Controller selector - Error when selecting the option ' + pageControllerDisplayName + ' ' + err);
        })
    }

    selectPageDescriptor(pageControllerDisplayName) {
        return this.switchToLiveEditFrame().then(() => {
            return this.doFilterControllersAndClickOnOption(pageControllerDisplayName);
        }).then(() => {
            return this.pause(1000);
        }).then(() => {
            return this.switchToParentFrame();
        }).then(() => {
            this.saveScreenshot('controller_selected');
            return this.waitForContextWindowVisible();
        })
    }

    switchToMainFrame() {
        return this.getBrowser().switchToParentFrame();
    }

    waitForControllerOptionFilterInputVisible() {
        return this.switchToLiveEditFrame().then(() => {
            return this.waitForElementDisplayed(this.controllerOptionFilterInput, appConst.TIMEOUT_5);
        }).catch(err => {
            console.log(err);
            return this.switchToParentFrame().then(() => {
                return false;
            })
        })
    }

    waitForControllerOptionFilterInputNotVisible() {
        return this.switchToLiveEditFrame().then(() => {
            return this.waitForElementNotDisplayed(this.controllerOptionFilterInput, appConst.TIMEOUT_5);
        }).catch(err => {
            console.log(err);
            return this.getBrowser().switchToParentFrame().then(() => {
                return false;
            });
        })
    }

    typeData(content) {
        let contentStepForm = new ContentStepForm();
        return this.waitForElementDisplayed(this.displayNameInput, appConst.TIMEOUT_2).catch(err => {
            return this.clickOnMinimizeEditIcon();
        }).then(() => {
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
        }).then(() => {
            this.pause(300);
        })
    }

    clickOnPublishDropdownHandle() {
        return this.waitForElementDisplayed(this.publishDropDownHandle, appConst.TIMEOUT_3).then(() => {
            return this.clickOnElement(this.publishDropDownHandle);
        }).catch(err => {
            if (err.type === "WaitUntilTimeoutError") {
                throw new Error("Publish dropdown handle is not visible!" + err);
            }
            throw new Error("Error when clicking on Publish dropdown handle " + err);
        }).then(() => {
            return this.pause(300);
        });
    }

    clickOnUnpublishmenuItem() {
        return this.clickOnPublishDropdownHandle().then(() => {
            return this.waitForElementDisplayed(this.unpublishMenuItem, appConst.TIMEOUT_3);
        }).then(() => {
            return this.clickOnElement(this.unpublishMenuItem);
        }).catch(err => {
            throw new Error("Error when unpublishing the contentS! " + err);
        });
    }

    clickOnMinimizeEditIcon() {
        let minimizeEditIcon = XPATH.container + "//div[@class='minimize-edit']";
        return this.clickOnElement(minimizeEditIcon).catch(err => {
            this.saveScreenshot('err_click_on_minimize_icon');
            throw new Error(err);
        });
    }

    hotKeyDelete() {
        return this.getBrowser().status().then(status => {
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                return this.getBrowser().keys(['Control', 'Delete']);
            }
            if (status.value.os.name.toLowerCase().includes('mac')) {
                return this.getBrowser().keys(['Command', 'Delete']);
            }
        })
    }

    hotKeySave() {
        return this.getBrowser().status().then(status => {
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                return this.getBrowser().keys(['Control', 's']);
            }
            if (status.os.name.toLowerCase().includes('mac')) {
                return this.getBrowser().keys(['Command', 's']);
            }
        }).then(() => {
            return this.pause(1000);
        })
    }

    hotKeyPublish() {
        return this.getBrowser().keys(['Control', 'Alt', 'p']);
    }

    async getContentStatus() {
        let result = await this.getDisplayedElements(XPATH.container + XPATH.status);
        return await result[0].getText();
        //return await this.getBrowser().getElementText(result[0].ELEMENT);
    }

    async getContentAuthor() {
        let result = await this.getDisplayedElements(XPATH.container + XPATH.author);
        return await result[0].getText();
        //return await this.getBrowser().getElementText(result[0].ELEMENT);
    }
};
module.exports = ContentWizardPanel;


