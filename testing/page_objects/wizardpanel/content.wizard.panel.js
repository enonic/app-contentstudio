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
const ConfirmationDialog = require("../../page_objects/confirmation.dialog");
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const VersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const BrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentDeleteDialog = require('../../page_objects/delete.content.dialog');
const ConfirmContentDeleteDialog = require('../../page_objects/confirm.content.delete.dialog');

const XPATH = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
    pageEditorTogglerButton: "//button[contains(@id, 'CycleButton') ]",
    displayNameInput: `//input[contains(@name,'displayName')]`,
    toolbar: `//div[contains(@id,'ContentWizardToolbar')]`,
    toolbarStateIcon: `//div[contains(@class,'toolbar-state-icon')]`,
    toolbarPublish: "//div[contains(@id,'ContentWizardToolbarPublishControls')]",
    saveButton: `//button[contains(@id,'ActionButton') and child::span[text()='Save']]`,
    savedButton: `//button[contains(@id,'ActionButton') and child::span[text()='Saved']]`,
    savingButton: `//button[contains(@id,'ActionButton') and child::span[text()='Saving...']]`,
    deleteButton: `//button[contains(@id,'ActionButton') and child::span[text()='Delete...']]`,
    publishButton: "//button[contains(@id,'ActionButton') and child::span[text()='Publish...']]",
    markAsReadyButton: "//button[contains(@id,'ActionButton') and child::span[text()='Mark as ready']]",
    openRequestButton: "//button[contains(@id,'ActionButton') and child::span[text()='Open Request...']]",
    unpublishButton: "//button[contains(@id,'ActionButton') and child::span[text()='Unpublish...']]",
    unpublishMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Unpublish...']",
    inspectionPanelToggler: "//button[contains(@id, 'TogglerButton') and contains(@class,'icon-cog')]",
    showComponentViewToggler: "//button[contains(@id, 'TogglerButton') and @title='Show Component View']",
    componentViewToggler: "//button[contains(@id, 'TogglerButton')  and contains(@class,'icon-clipboard')]",
    hideComponentViewToggler: "//button[contains(@id, 'TogglerButton') and @title='Hide Component View']",
    thumbnailUploader: "//div[contains(@id,'ThumbnailUploaderEl')]",
    liveEditFrame: "//iframe[contains(@class,'live-edit-frame shown')]",
    pageDescriptorViewer: `//div[contains(@id,'PageDescriptorViewer')]`,
    accessTabBarItem: `//li[contains(@id,'ContentTabBarItem') and @title='Access']`,
    scheduleTabBarItem: `//li[contains(@id,'ContentTabBarItem') and @title='Schedule']`,
    scheduleForm: "//div[contains(@id,'ScheduleWizardStepForm')]",
    detailsPanelToggleButton: `//button[contains(@id,'NonMobileContextPanelToggleButton')]`,
    itemViewContextMenu: `//div[contains(@id,'ItemViewContextMenu')]`,
    xDataToggler: `//div[contains(@id,'WizardStepsPanel')]//div[@class='x-data-toggler']`,
    stepNavigatorToolbar: `//ul[contains(@id,'WizardStepNavigator')]`,
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    author: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'author')]`,
    wizardStepByName:
        name => `//ul[contains(@id,'WizardStepNavigator')]//li[child::a[text()='${name}']]`,
    wizardStepByTitle:
        name => `//ul[contains(@id,'WizardStepNavigator')]//li[contains(@id,'ContentTabBarItem') and @title='${name}']`,
    xDataTogglerByName:
        name => `//div[contains(@id,'WizardStepsPanel')]//div[@class='x-data-toggler' and preceding-sibling::span[contains(.,'${name}')]]`,
    publishMenuItemByName: function (name) {
        return `//div[contains(@id,'ContentWizardToolbar')]//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and contains(.,'${name}')]`
    },
};

class ContentWizardPanel extends Page {

    get displayNameInput() {
        return XPATH.container + XPATH.displayNameInput;
    }

    get pageEditorTogglerButton() {
        return XPATH.toolbar + XPATH.pageEditorTogglerButton;
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
        return XPATH.container + XPATH.toolbar + XPATH.publishButton;
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
        return XPATH.container + XPATH.toolbar + XPATH.deleteButton;
    }

    get controllerOptionFilterInput() {
        return "//div[contains(@id,'PagePlaceholder')]" + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    //opens the ContextWindow with tabs:
    get showInspectionPanelToggler() {
        return XPATH.container + XPATH.toolbar + XPATH.inspectionPanelToggler;
    }

    get showComponentViewToggler() {
        return XPATH.container + XPATH.toolbar + XPATH.showComponentViewToggler;
    }

    get hideComponentViewToggler() {
        return XPATH.container + XPATH.toolbar + XPATH.hideComponentViewToggler;
    }

    get componentViewToggler() {
        return XPATH.container + XPATH.toolbar + XPATH.componentViewToggler;
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
                    return this.pause(400);
                })
            } else {
                console.log("Content wizard is opened and Details Panel is loaded");
            }
        })
    }

    async openVersionsHistoryPanel() {
        let detailsPanel = new DetailsPanel();
        let versionPanel = new VersionsWidget();
        await this.openDetailsPanel();
        await detailsPanel.openVersionHistory();
        return await versionPanel.waitForVersionsLoaded();
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
        return this.waitForElementNotDisplayed(stepXpath, appConst.TIMEOUT_2).catch(err => {
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

    async hotKeyCloseWizard() {
        try {
            await this.pause(1000);
            return await this.getBrowser().keys(['Alt', 'w']);
        } catch (err) {
            return await this.doSwitchToContentBrowsePanel();
        }
    }

    async hotKeySaveAndCloseWizard() {
        try {
            let status = await this.getBrowser().status();
            if (status.os.name.toLowerCase().includes('wind') || status.os.name.toLowerCase().includes('linux')) {
                await this.getBrowser().keys(['Control', 'Enter']);
                await this.doSwitchToContentBrowsePanel();
                return await this.pause(500);
            }
            if (status.os.name.toLowerCase().includes('mac')) {
                await this.getBrowser().keys(['Command', 'Enter']);
                await this.doSwitchToContentBrowsePanel();
                return await this.pause(500);
            }
        } catch (err) {
            console.log("Save and close the wizard " + err);
            await this.doSwitchToContentBrowsePanel();
        }
    }

    doSwitchToContentBrowsePanel() {
        console.log('testUtils:switching to Content Browse panel...');
        let browsePanel = new BrowsePanel();
        return this.getBrowser().switchWindow("Content Studio - Enonic XP Admin").then(() => {
            console.log("switched to content browse panel...");
        }).then(() => {
            return browsePanel.waitForGridLoaded(appConst.TIMEOUT_5);
        }).catch(err => {
            throw new Error("Error when switching to Content Studio App " + err);
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

    async waitForHideComponentViewTogglerDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.hideComponentViewToggler, appConst.TIMEOUT_4);
        } catch (err) {
            this.saveScreenshot('err_hide_component_view_not_displayed');
            throw new Error("'Hide Component View!' button should appear: " + err);
        }
    }

    async clickOnHideComponentViewToggler() {
        try {
            await this.waitForHideComponentViewTogglerDisplayed();
            await this.clickOnElement(this.hideComponentViewToggler);
        } catch (err) {
            this.saveScreenshot('err_click_on_hide_component_view');
            throw new Error("Error when clicking on 'Hide Component View' " + err);
        }
        return await this.pause(300);
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

    //exception will be thrown if Save button is disabled after 3 seconds
    async waitForSaveButtonEnabled() {
        try {
            await this.waitForSaveButtonVisible();
            return await this.waitForElementEnabled(this.saveButton, appConst.TIMEOUT_3);
        } catch (err) {
            throw new Error("Save button should be enabled in the wizard: " + err);
        }
    }

    waitForSaveButtonDisabled() {
        return this.waitForElementDisabled(this.saveButton, appConst.TIMEOUT_3).catch(err => {
            throw new Error("Content Wizard -Save button should be disabled! " + err);
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

    async getLiveFramePosition() {
        let el = await this.findElement(XPATH.liveEditFrame);
        let xValue = parseInt(await el.getLocation('x'));
        let yValue = parseInt(await el.getLocation('y'));
        return {x: xValue, y: yValue};
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

    getDisplayName() {
        return this.getTextInInput(this.displayNameInput);
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

    async clickOnDeleteAndDeleteNow() {
        let contentDeleteDialog = new ContentDeleteDialog();
        await this.clickOnDelete(this.deleteButton);
        await contentDeleteDialog.waitForDialogOpened();
        await contentDeleteDialog.clickOnDeleteNowButton();
        return await contentDeleteDialog.waitForDialogClosed();
    }

    async doMarkAsDeleted() {
        let contentDeleteDialog = new ContentDeleteDialog();
        await this.clickOnDelete(this.deleteButton);
        await contentDeleteDialog.waitForDialogOpened();
        await contentDeleteDialog.clickOnMarkAsDeletedMenuItem();
        return await contentDeleteDialog.waitForDialogClosed();
    }

    async clickOnDeleteAndMarkAsDeletedAndConfirm(numberItems) {
        let contentDeleteDialog = new ContentDeleteDialog();
        let confirmContentDeleteDialog = new ConfirmContentDeleteDialog();
        await this.clickOnDelete(this.deleteButton);
        await contentDeleteDialog.waitForDialogOpened();
        await contentDeleteDialog.clickOnMarkAsDeletedMenuItem();
        await confirmContentDeleteDialog.waitForDialogOpened();
        await confirmContentDeleteDialog.typeNumberOfContent(numberItems);
        await confirmContentDeleteDialog.clickOnConfirmButton();
        return await confirmContentDeleteDialog.waitForDialogClosed();
    }

    //clicks on 'Publish...' button
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

    //Click on Publish... button on toolbar, then clicks on Publish Now button on the modal dialog
    async doPublish() {
        await this.clickOnPublishButton();
        let contentPublishDialog = new ContentPublishDialog();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    }

    async openPublishMenu() {
        await this.clickOnPublishMenuDropdownHandle();
        await this.pause(300);
    }

    async waitForPublishMenuItemDisabled(menuItem) {
        let selector = XPATH.toolbar + XPATH.publishMenuItemByName(menuItem);
        return await this.waitForAttributeHasValue(selector, "class", "disabled");
    }

    async waitForPublishMenuItemEnabled(menuItem) {
        let selector = XPATH.toolbar + XPATH.publishMenuItemByName(menuItem);
        return await this.waitForAttributeNotIncludesValue(selector, "class", "disabled");
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
            throw new Error("Validation Error: Red icon is still displayed in the wizard after 2 seconds" + err);
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

    async doFilterControllersAndClickOnOption(pageControllerDisplayName) {
        try {
            let optionSelector = lib.slickRowByDisplayName(`//div[contains(@id,'PageDescriptorDropdown')]`, pageControllerDisplayName);
            await this.waitForElementDisplayed(this.controllerOptionFilterInput, appConst.TIMEOUT_5);
            await this.typeTextInInput(this.controllerOptionFilterInput, pageControllerDisplayName);
            await this.waitForElementDisplayed(optionSelector, appConst.TIMEOUT_3);
            await this.clickOnElement(optionSelector);
            return this.pause(700);
        } catch (err) {
            this.saveScreenshot('err_select_controller_in_wizard');
            throw new Error('Controller selector - Error when selecting the option ' + pageControllerDisplayName + ' ' + err);
        }
    }

    //Select a page descriptor and wait for Context Window is loaded
    async selectPageDescriptor(pageControllerDisplayName) {
        await this.switchToLiveEditFrame();
        await this.doFilterControllersAndClickOnOption(pageControllerDisplayName);
        await this.switchToParentFrame();
        this.saveScreenshot(contentBuilder.generateRandomName("controller"));
        return await this.waitForContextWindowVisible();
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

    async typeData(content) {
        let contentStepForm = new ContentStepForm();
        await this.waitForElementDisplayed(this.displayNameInput, appConst.TIMEOUT_2)
        await this.typeDisplayName(content.displayName);
        if (content.data != null) {
            await contentStepForm.type(content.data, content.contentType);
        }
        if (content.settings != null) {
            await this.typeSettings(content.settings);
        }
        return await this.pause(500);
    }

    clickOnPublishMenuDropdownHandle() {
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

    clickOnUnpublishMenuItem() {
        return this.clickOnPublishMenuDropdownHandle().then(() => {
            return this.waitForElementDisplayed(this.unpublishMenuItem, appConst.TIMEOUT_3);
        }).then(() => {
            return this.clickOnElement(this.unpublishMenuItem);
        }).catch(err => {
            throw new Error("Error when unpublishing the content! " + err);
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

    waitForShowPublishMenuButtonVisible() {
        return this.waitForElementDisplayed(this.publishDropDownHandle, appConst.TIMEOUT_3).catch(err => {
            throw new Error("Wizard - drop down handle in Publish menu is not visible!" + err);
        })
    }

    waitForMarkAsReadyButtonVisible() {
        let selector = XPATH.container + XPATH.markAsReadyButton;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3);
    }

    waitForOpenRequestButtonVisible() {
        let selector = XPATH.container + XPATH.openRequestButton;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3);
    }

    waitForPublishButtonVisible() {
        let selector = XPATH.container + XPATH.publishButton;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_3);
    }

    async getContentStatus() {
        let result = await this.getDisplayedElements(XPATH.container + XPATH.status);
        return await result[0].getText();
    }

    waitForContentStatus(expectedStatus) {
        let selector = XPATH.container +
                       `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status') and text()='${expectedStatus}']`;
        let message = "Element still not displayed! timeout is " + appConst.TIMEOUT_3 + "  " + selector;
        return this.getBrowser().waitUntil(() => {
            return this.isElementDisplayed(selector);
        }, appConst.TIMEOUT_3, message);

    }

    async getContentAuthor() {
        let result = await this.getDisplayedElements(XPATH.container + XPATH.author);
        return await result[0].getText();
    }

    async isPublishMenuItemPresent(menuItem) {
        try {
            await this.waitForShowPublishMenuButtonVisible();
            await this.clickOnElement(this.publishDropDownHandle);
            await this.pause(700);
            let selector = XPATH.publishMenuItemByName(menuItem);
            let result = await this.findElements(selector);
            return result.length > 0;
        } catch (err) {
            throw new Error("Error when open the publish menu: " + err);
        }
    }

    async openPublishMenuSelectItem(menuItem) {
        try {
            await this.waitForShowPublishMenuButtonVisible();
            await this.clickOnElement(this.publishDropDownHandle);
            await this.pause(500);
            let selector = XPATH.publishMenuItemByName(menuItem);
            await this.waitForElementEnabled(selector, appConst.TIMEOUT_2);
            await this.clickOnElement(selector);
            return this.pause(300);
        } catch (err) {
            this.saveScreenshot("err_click_issue_menuItem");
            throw new Error('error when try to click on publish menu item, ' + err);
        }
    }

    //Clicks on publish-menu dropdown handler then click on Publish... menu item
    async openPublishMenuAndPublish() {
        let contentPublishDialog = new ContentPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        //1. Click on Publish... menu item
        await contentWizardPanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
        //2. Wait for modal dialog opened
        await contentPublishDialog.waitForDialogOpened();
        //3. Click on Publish Now button
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    }

    async openPublishMenuAndCreateRequestPublish(changes, assignees) {
        let createRequestPublishDialog = new CreateRequestPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await contentWizardPanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await createRequestPublishDialog.waitForDialogLoaded();
        await createRequestPublishDialog.clickOnNextButton();
        await createRequestPublishDialog.typeInChangesInput(changes);
        return await createRequestPublishDialog.clickOnCreateRequestButton();
    }

    async showPublishMenuClickOnMarkAsReadyMenuItem() {
        await this.openPublishMenuSelectItem(appConst.PUBLISH_MENU.MARK_AS_READY);
        let dialog = new ConfirmationDialog();
        await dialog.waitForDialogOpened();
        return await dialog.clickOnYesButton();
    }

    async clickOnMarkAsReadyButton() {
        let selector = XPATH.container + XPATH.markAsReadyButton;
        await this.waitForMarkAsReadyButtonVisible();
        await this.clickOnElement(selector);
        return this.pause(1000);
    }

    async clickOnUnpublishButton() {
        let selector = XPATH.container + XPATH.unpublishButton;
        await this.waitForUnpublishButtonDisplayed();
        await this.clickOnElement(selector);
        return this.pause(600);
    }

    waitForUnpublishButtonDisplayed() {
        let selector = XPATH.container + XPATH.unpublishButton;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
    }

    waitForPublishButtonDisplayed() {
        let selector = XPATH.container + XPATH.publishButton;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
    }

    async getToolbarWorkflowState() {
        let selector = XPATH.toolbar + XPATH.toolbarStateIcon;
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_4);
        let result = await this.getAttribute(selector, 'class');
        if (result.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (result.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        } else if (result === 'toolbar-state-icon pull-right') {
            return appConst.WORKFLOW_STATE.PUBLISHED;

        } else {
            throw new Error("Error when getting content's state, class is:" + result);
        }
    }

    async waitForStateIconNotDisplayed() {
        try {
            let selector = XPATH.toolbar + XPATH.toolbarStateIcon;
            return await this.waitForElementNotDisplayed(selector, appConst.TIMEOUT_4);
        } catch (err) {
            this.saveScreenshot("err_workflow_state_should_not_be_visible");
            throw new Error("Workflow state should be not visible!" + err);
        }
    }

    async getIconWorkflowState() {
        let selector = XPATH.thumbnailUploader;
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        let result = await this.getAttribute(selector, 'class');
        if (result.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (result.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        } else {
            return undefined;
        }
    }

    async clickOnPageEditorToggler() {
        try {
            await this.waitForElementDisplayed(this.pageEditorTogglerButton, appConst.TIMEOUT_3);
            await this.clickOnElement(this.pageEditorTogglerButton);
            return await this.pause(1000);
        } catch (err) {
            throw new Error("Page Editor toggler: " + err);
        }
    }
};
module.exports = ContentWizardPanel;


