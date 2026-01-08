/**
 * Created on 5/30/2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const {BUTTONS, DROPDOWN, LIVE_VIEW, WIZARD, COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentStepForm = require('./content.wizard.step.form');
const WizardContextPanel = require('./details/wizard.context.window.panel');
const ConfirmationDialog = require("../../page_objects/confirmation.dialog");
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const VersionsWidget = require('./details/wizard.versions.widget');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const BrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const RenamePublishedContentDialog = require('./rename.content.dialog');
const ContentUnpublishDialog = require('../content.unpublish.dialog');
const PropertiesWidget = require('../browsepanel/detailspanel/properties.widget.itemview');
const EditSettingsDialog = require('../details_panel/edit.settings.dialog');
const PageDescriptorDropdown = require('../components/selectors/page.descriptor.dropdown');
const {Key} = require('webdriverio');

const XPATH = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
    projectViewerDiv: `//div[contains(@id,'ProjectViewer')]`,
    wizardHeader: "//div[contains(@id,'ContentWizardHeader')]",
    showPageEditorTogglerButton: "//button[contains(@id,'ContentActionCycleButton') and @title='Show Page Editor']",
    displayNameInput: "//input[@name='displayName']",
    toolbar: `//div[contains(@id,'ContentWizardToolbar')]`,
    contentItemPreviewToolbar: `//div[contains(@id,'ContentItemPreviewToolbar')]`,
    toolbarStateIcon: `//div[contains(@class,'toolbar-state-icon')]`,
    publishMenuButton: "//div[contains(@id,'ContentWizardPublishMenuButton')]",
    toolbarPublish: "//div[contains(@id,'ContentWizardToolbarPublishControls')]",
    createIssueButton: "//button[contains(@id,'ActionButton') and child::span[text()='Create Issue...']]",
    markAsReadyButton: "//button[contains(@id,'ActionButton') and child::span[text()='Mark as ready']]",
    openRequestButton: "//button[contains(@id,'ActionButton') and child::span[text()='Open Request...']]",
    unpublishButton: "//button[contains(@id,'ActionButton') and child::span[text()='Unpublish...']]",
    unpublishMenuItem: "//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and text()='Unpublish...']",
    inspectionPanelToggler: "//button[contains(@id, 'TogglerButton') and contains(@class,'icon-cog')]",
    thumbnailUploader: "//div[contains(@id,'ThumbnailUploaderEl')]",
    scheduleTabBarItem: `//li[contains(@id,'ContentTabBarItem') and @title='Schedule']`,

    itemViewContextMenu: `//div[contains(@id,'ItemViewContextMenu')]`,
    xDataToggler: `//div[contains(@id,'WizardStepsPanel')]//div[@class='x-data-toggler']`,
    stepNavigatorToolbar: `//ul[contains(@id,'WizardStepNavigator')]`,
    wizardStepNavigatorAndToolbar: "//div[contains(@id,'WizardStepNavigatorAndToolbar')]",
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    author: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'author')]`,

    shaderPage: "//div[@class='xp-page-editor-shader xp-page-editor-page']",
    goToGridButton: "//div[contains(@class,'font-icon-default icon-tree-2')]",
    pagePlaceholderInfoBlock1: "//div[contains(@id,'PagePlaceholderInfoBlock')]//div[contains(@class,'page-placeholder-info-line1')]",
    showChangesButtonToolbar: "//button[contains(@class,'show-changes') and @title='Show changes']",
    wizardStepByName:
        name => `//ul[contains(@id,'WizardStepNavigator')]//li[child::a[text()='${name}']]`,
    wizardStepByTitle:
        name => `//ul[contains(@id,'WizardStepNavigator')]//li[contains(@id,'ContentTabBarItem') and @title='${name}']`,
    xDataTogglerByName:
        name => `//div[contains(@id,'WizardStepsPanel')]//div[contains(@id,'ContentPanelStripHeader') and child::span[contains(.,'${name}')]]//button[contains(@class,'toggler-button')]`,
    publishMenuItemByName(name) {
        return `//div[contains(@id,'ContentWizardToolbar')]//ul[contains(@id,'Menu')]//li[contains(@id,'MenuItem') and contains(.,'${name}')]`
    },
};

class ContentWizardPanel extends Page {

    get previewItemToolbar() {
        return XPATH.container + XPATH.contentItemPreviewToolbar;
    }

    get markAsReadyButton() {
        return XPATH.container + BUTTONS.actionButtonStrict('Mark as ready');
    }

    get emulatorDropdown() {
        return this.previewItemToolbar + LIVE_VIEW.EMULATOR_DROPDOWN;
    }

    get previewWidgetDropdown() {
        return this.previewItemToolbar + LIVE_VIEW.DIV_DROPDOWN;
    }

    get displayNameInput() {
        return XPATH.container + WIZARD.DISPLAY_NAME_INPUT;
    }

    get modifyPathSpan() {
        return XPATH.wizardHeader + COMMON.RENAME_CONTENT_SPAN;
    }

    get pathInput() {
        return XPATH.container + WIZARD.PATH_INPUT;
    }

    get minimizeLiveEditToggler() {
        return XPATH.wizardStepNavigatorAndToolbar + LIVE_VIEW.MINIMIZE_BUTTON;
    }

    get pageEditorTogglerButton() {
        return XPATH.toolbar + LIVE_VIEW.PAGE_EDITOR_TOGGLE_BUTTON;
    }

    get detailsPanelToggleButton() {
        return XPATH.container + COMMON.CONTEXT_WINDOW_TOGGLE_BUTTON;
    }

    get saveButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Save');
    }

    get resetButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Reset');
    }

    get savedButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Saved');
    }

    get savingButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Saving...');
    }

    get publishButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Publish...');
    }

    get publishDropDownHandle() {
        return XPATH.toolbarPublish + DROPDOWN.DROP_DOWN_HANDLE;
    }

    get unpublishMenuItem() {
        return XPATH.toolbarPublish + XPATH.unpublishMenuItem;
    }

    get thumbnailUploader() {
        return XPATH.container + XPATH.thumbnailUploader;
    }

    get showChangesToolbarButton() {
        return this.previewItemToolbar + XPATH.showChangesButtonToolbar;
    }

    get workflowIconAndValidation() {
        return this.thumbnailUploader + `//div[contains(@class, 'workflow-status')]`;
    }

    get archiveButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Archive');
    }

    get duplicateButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Duplicate');
    }

    get localizeButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.actionButtonStrict('Localize');
    }

    // Preview button on the previewItemToolbar
    get previewButton() {
        return this.previewItemToolbar + BUTTONS.actionButtonStrict('Preview');
    }

    get controllerOptionFilterInput() {
        return `//div[contains(@id,'PageDescriptorDropdown')]` + lib.OPTION_FILTER_INPUT;
    }

    get wizardToolbarHelpButton() {
        return XPATH.wizardStepNavigatorAndToolbar + lib.HELP_TEXT.BUTTON;
    }

    get goToGridButton() {
        return XPATH.toolbar + XPATH.goToGridButton;
    }

    async waitForHelpTextsButtonTogglerDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.wizardToolbarHelpButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Help texts' toggle button is not displayed in the Content Wizard`, 'err_help_text_button', err);
        }
    }

    async waitForLocalizeButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.localizeButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.localizeButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Localize' button is not enabled in the Content Wizard`, 'err_localize_button_enabled', err);
        }
    }

    async clickOnLocalizeButton() {
        await this.waitForLocalizeButtonEnabled();
        await this.clickOnElement(this.localizeButton);
    }

    async clickOnHelpTextsToggler() {
        await this.waitForHelpTextsButtonTogglerDisplayed();
        return await this.clickOnElement(this.wizardToolbarHelpButton);
    }

    waitForShaderDisplayed() {
        return this.waitForElementDisplayed(XPATH.shaderPage, appConst.mediumTimeout);
    }

    // opens 'Context Window' if it is not loaded
    async openContextWindow() {
        let wizardContextWindow = new WizardContextPanel();
        try {
            let result = await wizardContextWindow.isOpened();
            if (!result) {
                await this.clickOnContextWindowPanelToggleButton();
                await wizardContextWindow.waitForOpened();
            } else {
                console.log('Content wizard, Context Window is loaded');
            }
            return wizardContextWindow;
        } catch (err) {
            await this.handleError('Context Window should be loaded in Wizard', 'err_open_context_panel', err);
        }
    }

    async clickOnContextWindowPanelToggleButton() {
        try {
            await this.clickOnElement(this.detailsPanelToggleButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Content Wizard- Context Window Panel toggle button', 'err_click_context_win_toggle', err);
        }
    }

    async openVersionsHistoryPanel() {
        try {
            let wizardContextWindow = new WizardContextPanel();
            let versionPanel = new VersionsWidget();
            await this.openContextWindow();
            await wizardContextWindow.openVersionHistory();
            await versionPanel.waitForVersionsLoaded();
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Versions History panel should be opened in Wizard', 'err_open_versions_panel', err);
        }
    }

    async waitForXdataTogglerVisible(name) {
        try {
            return await this.waitForElementDisplayed(XPATH.xDataTogglerByName(name), appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_x_data_toggle');
            throw new Error(`x-data toggle is not visible on the wizard page, screenshot:${screenshot} ` + err);
        }
    }

    isWizardStepPresent(stepName) {
        let stepXpath = XPATH.wizardStepByName(stepName);
        return this.waitForElementDisplayed(stepXpath, appConst.shortTimeout).catch(err => {
            console.log("Wizard step is not visible: " + err);
            return false;
        })
    }

    async waitForWizardStepDisplayed(stepName) {
        try {
            let locator = XPATH.wizardStepByTitle(stepName);
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Wizard step: ${stepName} was not displayed`, 'err_wizard_step_displayed', err);
        }
    }

    async waitForWizardStepNotDisplayed(stepName) {
        let locator = XPATH.wizardStepByTitle(stepName);
        return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    async clickOnWizardStep(stepName) {
        try {
            let locator = XPATH.wizardStepByTitle(stepName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`tried to click on wizard step: ${stepName}`, 'err_wizard_step_click', err);
        }
    }

    async waitForWizardStepByTitleNotVisible(title) {
        try {
            let stepXpath = XPATH.wizardStepByTitle(title);
            return await this.waitForElementNotDisplayed(stepXpath, appConst.shortTimeout);
        } catch (err) {
            console.log("Wizard step is not visible: " + title);
            return false;
        }
    }

    async clickOnXdataTogglerByName(name) {
        try {
            await this.waitForElementDisplayed(XPATH.xDataTogglerByName(name), appConst.mediumTimeout);
            await this.clickOnElement(XPATH.xDataTogglerByName(name));
            return await this.pause(400);
        } catch (err) {
            await this.handleError(`Tried to click on X-data toggle`, 'err_x_data_toggle_click', err);
        }
    }

    // Gets titles of all x-data forms
    async getXdataTitles() {
        try {
            let selector = `//div[contains(@id,'ContentPanelStripHeader')]/span`;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getTextInElements(selector);
        } catch (err) {
            await this.handleError(`Error when trying to get titles of x-data forms`, 'err_x_data_titles', err);
        }
    }

    async hotKeyCloseWizard() {
        try {
            await this.pause(1000);
            await this.getBrowser().keys(['Alt', 'w']);
            await this.doSwitchToContentBrowsePanel();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hot_key');
            console.log(`Alt+w hot key error: screenshot ${screenshot} ` + err);
            return await this.doSwitchToContentBrowsePanel();
        }
    }

    async hotKeySaveAndCloseWizard() {
        try {
            let status = await this.getBrowser().status();
            await this.getBrowser().keys(['Control', 'Enter']);
            await this.doSwitchToContentBrowsePanel();
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_close_wizard');
            await this.doSwitchToContentBrowsePanel();
            throw new Error(`Wizard was not closed!  screenshot: ${screenshot} ` + err);
        }
    }

    async doSwitchToContentBrowsePanel() {
        try {
            console.log('testUtils:switching to Content Browse panel...');
            let browsePanel = new BrowsePanel();
            await this.getBrowser().switchWindow('Content Studio - Enonic XP Admin');
            console.log("switched to content browse panel...");
            return await browsePanel.waitForGridLoaded(appConst.longTimeout);
        } catch (err) {
            await this.handleError(`Tried to switch to Content Browse panel`, 'err_switch_browse_panel', err);
        }
    }

    async waitForShowContextPanelButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.detailsPanelToggleButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Context Window toggle button should be displayed', 'err_context_window_toggle_button', err);
        }
    }

    async waitForHideContextPanelButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.detailsPanelToggleButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Context Window toggle button should be displayed', 'err_context_window_toggle_button', err);
        }
    }

    async waitForHidePageEditorTogglerButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(LIVE_VIEW.HIDE_PAGE_EDITOR_BUTTON, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Hide Page Editor' button is not displayed in the Content Wizard`, 'err_hide_page_editor_button', err);
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(this.displayNameInput, appConst.longTimeout);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Content wizard should be opened', 'err_wizard_opened', err);
        }
    }

    // exception will be thrown if Save button is disabled after 3 seconds
    async waitForSaveButtonEnabled() {
        try {
            await this.waitForSaveButtonVisible();
            return await this.waitForElementEnabled(this.saveButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Save' button should be enabled in the Content Wizard`, 'err_save_button_enabled', err);
        }
    }

    async waitForSaveButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.saveButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Save' button should be disabled in the Content Wizard`, 'err_save_button_disabled', err);
        }
    }

    async waitForSaveButtonVisible() {
        try {
            return await this.waitForElementDisplayed(this.saveButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError(`'Save' button is not visible in the Content Wizard`, 'err_save_button_not_visible', err);
        }
    }

    async waitForSaveButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.saveButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError(`'Save' button is still visible in the Content Wizard`, 'err_save_button_visible', err);
        }
    }

    async waitForSavedButtonVisible() {
        try {
            await this.waitForElementDisplayed(this.savedButton, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.savedButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Saved' button is not visible or it is not disabled`, 'err_saved_button_not_visible', err);
        }
    }

    switchToLiveEditFrame() {
        return this.switchToFrame(lib.LIVE_EDIT_FRAME);
    }

    switchToEmptyLiveEditFrame() {
        return this.switchToFrame(lib.LIVE_VIEW.EMPTY_LIVE_FRAME_DIV);
    }

    waitForLiveEditVisible() {
        return this.waitForElementDisplayed(lib.LIVE_EDIT_FRAME, appConst.mediumTimeout);
    }

    waitForLiveEditNotVisible() {
        return this.waitForElementNotDisplayed(lib.LIVE_EDIT_FRAME, appConst.mediumTimeout);
    }

    async getLiveFramePosition() {
        let el = await this.findElement(lib.LIVE_EDIT_FRAME);
        let xValue = parseInt(await el.getLocation('x'));
        let yValue = parseInt(await el.getLocation('y'));
        return {x: xValue, y: yValue};
    }

    typeDisplayName(displayName) {
        return this.typeTextInInput(this.displayNameInput, displayName);
    }

    typeInPathInput(path) {
        return this.typeTextInInput(this.pathInput, path);
    }

    getDisplayName() {
        return this.getTextInInput(this.displayNameInput);
    }

    getPath() {
        return this.getTextInInput(this.pathInput);
    }

    clearDisplayNameInput() {
        return this.clearInputText(this.displayNameInput);
    }

    async waitAndClickOnSave() {
        try {
            await this.waitForSaveButtonEnabled();
            await this.clickOnElement(this.saveButton);
            await this.waitForSavingButtonNotVisible();
            return await this.pause(800);
        } catch (err) {
            await this.handleError('Error in waitAndClickOnSave', 'err_save_content', err);
        }
    }

    waitForSavingButtonNotVisible() {
        return this.waitForElementNotDisplayed(this.savingButton, appConst.longTimeout);
    }

    async clickOnArchiveButton() {
        try {
            await this.waitForArchiveButtonEnabled();
            return await this.clickOnElement(this.archiveButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_archive_btn_wizard');
            throw new Error(`Error when clicking on Archive button, screenshot:${screenshot}  ` + err);
        }
    }

    // clicks on 'Publish...' button
    async clickOnPublishButton() {
        try {
            await this.waitForElementDisplayed(this.publishButton, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.publishButton, appConst.mediumTimeout);
            await this.clickOnElement(this.publishButton);
            let contentPublishDialog = new ContentPublishDialog();
            await contentPublishDialog.waitForDialogOpened();
            return await contentPublishDialog.waitForSpinnerNotVisible(appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Tried to click on Publish button', 'err_publish_button_wizard', err);
        }
    }

    // Click on Publish... button on toolbar, then clicks on Publish Now button on the modal dialog
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
        return await this.waitForAttributeHasValue(selector, 'class', 'disabled');
    }

    async waitForReadOnlyMode() {
        try {
            let locator = XPATH.container;
            return await this.waitForAttributeHasValue(locator, 'class', 'no-modify-permissions');
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_readonly_mode');
            throw new Error(`Content wizard panel should be in Read only mode! screenshot:${screenshot} ` + err);
        }
    }

    async waitForEditMode() {
        try {
            return await this.waitForAttributeNotIncludesValue(XPATH.container, 'class', 'no-modify-permissions');
        } catch (err) {
            let screenshot = this.saveScreenshotUniqueName('err_edit_mode');
            throw new Error(`Content wizard panel is in Read only mode! screenshot:${screenshot} ` + err);
        }
    }

    async waitForPublishMenuItemEnabled(menuItem) {
        let selector = XPATH.toolbar + XPATH.publishMenuItemByName(menuItem);
        return await this.waitForAttributeNotIncludesValue(selector, 'class', 'disabled');
    }

    async isContentInvalid() {
        try {
            let locator = this.workflowIconAndValidation;
            let result = await this.getAttribute(locator, 'class');
            return result.includes('invalid');
        } catch (err) {
            await this.handleError(`Error when trying to check if content is invalid`, 'err_wizard_validation', err);
        }
    }

    async waitUntilInvalidIconAppears() {
        try {
            let locator = this.workflowIconAndValidation;
            await this.waitUntilInvalid(locator);
        } catch (err) {
            await this.handleError('Validation Error: invalid-icon did not appear in content-wizard', 'err_wizard_validation', err);
        }
    }

    async waitUntilInvalidIconDisappears() {
        let locator = this.workflowIconAndValidation;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, 'class');
            return !result.includes('invalid');
        }, {
            timeout: appConst.mediumTimeout,
            timeoutMsg: 'Validation Error: Red icon is still displayed in the wizard after 3 seconds'
        });
    }

    async typeSettings(settings) {
        let propertiesWidget = new PropertiesWidget();
        let editSettingsDialog = new EditSettingsDialog();
        if (settings.language) {
            await propertiesWidget.clickOnEditSettingsButton();
            await editSettingsDialog.waitForLoaded();
            await editSettingsDialog.filterOptionsAndSelectLanguage(settings.language);
            await editSettingsDialog.clickOnApplyButton();
        }
    }

    // Switches to the live edit frame, opens context menu and clicks on 'Page settings' item
    async openLockedSiteContextMenuClickOnPageSettings() {
        await this.doOpenItemViewContextMenu();
        await this.saveScreenshot(appConst.generateRandomName('unlock_context_menu'));
        return await this.clickOnPageSettingsMenuItem();
    }

    // Opens context menu with 'Page Settings' with contentName in its title
    async doOpenPageViewContextMenu(contentName) {
        try {
            let frameContainer = `//div[contains(@id,'FrameContainer')]`;
            await this.waitForElementDisplayed(frameContainer, appConst.mediumTimeout);
            await this.clickOnElement(frameContainer);
            let menuLocator = `//div[contains(@id,'ItemViewContextMenu') and descendant::h6[contains(@class,'main-name') and text()='${contentName}']]`;
            await this.waitForElementDisplayed(menuLocator, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Content wizard, tried to open Page View Context Menu(Page Setting)', 'err_page_view_context_menu', err);
        }
    }

    // Opens context menu with 'Page Settings' item
    async doOpenItemViewContextMenu() {
        try {
            let selector = `//div[contains(@id,'FrameContainer')]`;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            await this.switchToLiveEditFrame();
            await this.waitForElementDisplayed(XPATH.itemViewContextMenu, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Content wizard, tried to open Item View Context Menu', 'err_item_view_context_menu', err);
        }
    }

    // wait for 'Page settings' context menu item and click on it:
    async clickOnPageSettingsMenuItem() {
        let locator = XPATH.itemViewContextMenu + `//dl//dt[text()='Page settings']`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    async waitForPageSettingsMenuItemDisplayed() {
        try {
            let locator = XPATH.itemViewContextMenu + `//dl//dt[text()='Page settings']`;
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Universal Editor - Page settings menu item is not displayed', 'err_page_settings_menu_item', err);
        }
    }

    isPageControllerFilterInputClickable() {
        return this.isClickable(this.controllerOptionFilterInput);
    }

    // Select a page descriptor and wait for Context Window is loaded
    // // TODO 8607
    async selectPageDescriptor(pageControllerDisplayName, checkContextPanel) {
        let pageDescriptorDropdown = new PageDescriptorDropdown();
        await pageDescriptorDropdown.selectFilteredControllerAndClickOnOk(pageControllerDisplayName)
        if (typeof checkContextPanel === 'undefined' || checkContextPanel) {
            //await this.waitForContextWindowVisible();
        }
        await this.pause(500);
    }

    switchToMainFrame() {
        return this.getBrowser().switchToParentFrame();
    }

    async typeData(content) {
        if (!content || typeof content !== 'object') {
            throw new Error('Invalid content object passed to typeData');
        }

        try {
            // 1. Wait for display name input to be visible
            await this.waitForElementDisplayed(this.displayNameInput, appConst.shortTimeout);

            // 2. Type display name if present
            if (content.displayName) {
                await this.typeDisplayName(content.displayName);
            }

            // 3. Type main data if present
            if (content.data) {
                const contentStepForm = new ContentStepForm();
                await contentStepForm.type(content.data, content.contentType);
            }
            // 4. Type settings if present
            if (content.settings) {
                const wizardContextPanel = new WizardContextPanel();
                await this.openContextWindow();
                // Ensure context panel is open and 'Details' widget is selected
                if ((await wizardContextPanel.getSelectedOptionInWidgetSelectorDropdown()) !== 'Details') {
                    await this.openDetailsWidget();
                }
                await this.typeSettings(content.settings);
            }
            // 5. Short pause for UI stabilization
            await this.pause(300);
        } catch (err) {
            await this.handleError('Content Wizard, error while filling in content data', 'err_type_content_data', err);
        }
    }

    async typeData1(content) {
        try {
            let contentStepForm = new ContentStepForm();
            await this.waitForElementDisplayed(this.displayNameInput, appConst.shortTimeout);
            await this.typeDisplayName(content.displayName);
            if (content.data != null) {
                await contentStepForm.type(content.data, content.contentType);
            }
            if (content.settings != null) {
                let wizardContextPanel = new WizardContextPanel();
                let option = await wizardContextPanel.getSelectedOptionInWidgetSelectorDropdown();
                if (option !== 'Details') {
                    await this.openDetailsWidget();
                }
                await this.typeSettings(content.settings);
            }
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Content Wizard, tried to fill in the content data', 'err_type_content_data', err);
        }
    }

    async clickOnPublishMenuDropdownHandle() {
        try {
            await this.waitForElementDisplayed(this.publishDropDownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.publishDropDownHandle);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Content wizard, tried to click on Publish menu dropdown handle', 'err_click_on_dropdown', err);
        }
    }

    async clickOnUnpublishMenuItem() {
        try {
            await this.clickOnPublishMenuDropdownHandle();
            await this.waitForElementDisplayed(this.unpublishMenuItem, appConst.mediumTimeout);
            await this.clickOnElement(this.unpublishMenuItem);
        } catch (err) {
            await this.handleError('Content wizard, tried to click on unpublish menu item', 'err_unpublish_menu_item', err);
        }
    }

    async waitForMinimizeLiveEditTogglerNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.minimizeLiveEditToggler, appConst.mediumTimeout);
    }

    async waitForMinimizeLiveEditTogglerDisplayed() {
        await this.waitForElementDisplayed(this.minimizeLiveEditToggler, appConst.mediumTimeout);
        await this.pause(500);
    }

    async clickOnMinimizeLiveEditToggler() {
        try {
            await this.waitForMinimizeLiveEditTogglerDisplayed();
            await this.clickOnElement(this.minimizeLiveEditToggler);
            await this.pause(400);
        } catch (err) {
            await this.handleError('Content wizard, tried to click on minimize live edit toggle', 'err_minimize_icon', err);
        }
    }

    async hotKeyDelete() {
        const isMacOS = await this.isMacOS();
        const keyCombination = isMacOS ? [Key.Command, Key.Delete] : [Key.Ctrl, Key.Delete];
        return await this.getBrowser().keys(keyCombination);
    }

    async hotKeySave() {
        const isMacOS = await this.isMacOS();
        const keyCombination = isMacOS ? [Key.Command, 's'] : [Key.Ctrl, 's'];
        return await this.getBrowser().keys(keyCombination);
    }

    async hotKeyPublish() {
        const isMacOS = await this.isMacOS();
        const keyCombination = isMacOS ? [Key.Command, Key.Alt, 'p'] : [Key.Ctrl, Key.Alt, 'p'];
        return await this.getBrowser().keys(keyCombination);
    }

    async waitForShowPublishMenuButtonVisible() {
        try {
            return await this.waitForElementDisplayed(this.publishDropDownHandle, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Wizard Publish Menu- drop down handle is not visible', 'err_publish_menu_dropdown_handle', err);
        }
    }

    async waitForMarkAsReadyButtonVisible() {
        return await this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
    }

    async waitForOpenRequestButtonVisible() {
        let selector = XPATH.container + XPATH.openRequestButton;
        return await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
    }

    async clickOnOpenRequestButton() {
        try {
            await this.waitForOpenRequestButtonVisible();
            return await this.clickOnElement(XPATH.container + XPATH.openRequestButton);
        } catch (err) {
            await this.handleError(`Tried to click on 'Open Request button'`, 'err_open_request_button', err);
        }
    }

    // Gets content status from the Item Preview toolbar
    async getContentStatus() {
        try {
            let locator = this.previewItemToolbar + XPATH.status;
            let result = await this.getDisplayedElements(XPATH.container + XPATH.status);
            return await result[0].getText();
        } catch (err) {
            await this.handleError(`Tried to get the content-status from the Item Wizard Preview toolbar`, 'err_get_content_status', err);
        }
    }

    // Waits until content status in the Item Preview toolbar equals to expectedStatus
    async waitForContentStatus(expectedStatus) {
        try {
            let selector = this.previewItemToolbar +
                           `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status') and text()='${expectedStatus}']`;
            let message = "Element still not displayed! timeout is " + appConst.mediumTimeout + "  " + selector;
            await this.getBrowser().waitUntil(async () => {
                return await this.isElementDisplayed(selector);
            }, appConst.mediumTimeout, message);
        } catch (err) {
            await this.handleError(`Waited for the content status: ${expectedStatus}`, 'err_content_status', err);
        }
    }

    async isPublishMenuItemPresent(menuItem) {
        try {
            await this.waitForShowPublishMenuButtonVisible();
            await this.clickOnElement(this.publishDropDownHandle);
            await this.pause(1000);
            let selector = XPATH.publishMenuItemByName(menuItem);
            let result = await this.findElements(selector);
            return result.length > 0;
        } catch (err) {
            await this.handleError(`Tried to check if publish menu item is present: ${menuItem}`, 'err_publish_menu_item', err);
        }
    }

    async openPublishMenuSelectItem(menuItem) {
        try {
            await this.waitForShowPublishMenuButtonVisible();
            await this.clickOnElement(this.publishDropDownHandle);
            await this.pause(500);
            let selector = XPATH.publishMenuItemByName(menuItem);
            await this.waitForElementEnabled(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Tried to open Publish menu and select item: ${menuItem}`, 'err_click_publish_menu_item', err);
        }
    }

    // Clicks on publish-menu dropdown handler then click on Publish... menu item
    async openPublishMenuAndPublish() {
        let contentPublishDialog = new ContentPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        //1. Click on Publish... menu item
        await contentWizardPanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
        //2. Wait for modal dialog opened
        await contentPublishDialog.waitForDialogOpened();
        //3. Click on Publish Now button
        await contentPublishDialog.clickOnPublishNowButton();
        await contentPublishDialog.waitForDialogClosed();
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

    async clickOnMarkAsReadyButton() {
        try {
            await this.waitForMarkAsReadyButtonVisible();
            await this.clickOnElement(this.markAsReadyButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Tried to click on 'Mark As Ready' button`, 'err_mark_as_ready_button', err);
        }
    }

    async clickOnUnpublishButton() {
        let selector = XPATH.container + XPATH.unpublishButton;
        await this.waitForUnpublishButtonDisplayed();
        await this.clickOnElement(selector);
        let unpublishDialog = new ContentUnpublishDialog();
        await unpublishDialog.waitForDialogOpened();
        return unpublishDialog;
    }

    waitForUnpublishButtonDisplayed() {
        let selector = XPATH.container + XPATH.unpublishButton;
        return this.waitForElementDisplayed(selector, appConst.longTimeout);
    }

    async waitForPublishButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.publishButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(`'Publish...' button should be displayed in the Content Wizard`, 'err_publish_button_displayed', err);
        }
    }

    // Wait for 'Create Issue' button gets default action in 'Publish' menu:
    async waitForCreateIssueButtonDisplayed() {
        try {
            let selector = XPATH.container + XPATH.publishMenuButton + XPATH.createIssueButton;
            return await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(`'Create Issue...' button should be displayed as default action`, 'err_publish_menu_def_action', err);
        }
    }

    // wait for Workflow icon is not displayed in the toolbar
    async waitForStateIconNotDisplayed() {
        try {
            let selector = XPATH.toolbar + XPATH.toolbarStateIcon;
            return await this.waitForElementNotDisplayed(selector, appConst.TIMEOUT_4);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_workflow_state');
            throw new Error(`Workflow state should be not visible, screenshot: ${screenshot} ` + err);
        }
    }

    // Gets workflow state in the wizard toolbar or null
    async getContentWorkflowState() {
        let locator = this.workflowIconAndValidation;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        let result = await this.getAttribute(locator, 'title');
        return result;
    }

    // Clicks on Page Editor toggle (monitor icon). Show Page Editor
    async clickOnPageEditorToggler() {
        try {
            await this.waitForElementDisplayed(this.pageEditorTogglerButton, appConst.mediumTimeout);
            await this.clickOnElement(this.pageEditorTogglerButton);
            return await this.pause(800);
        } catch (err) {
            await this.handleError(`Tried to click on Page Editor toggle`, 'err_page_editor_toggle', err);
        }
    }

    waitForPageEditorTogglerDisplayed() {
        return this.waitForElementDisplayed(this.pageEditorTogglerButton, appConst.mediumTimeout);
    }

    async getProjectDisplayName() {
        let selector = XPATH.toolbar + `//div[contains(@class,'project-info')]` + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.getText(selector);
    }

    isDisplayNameInputClickable() {
        return this.isClickable(this.displayNameInput);
    }

    waitForDuplicateButtonEnabled() {
        return this.waitForElementEnabled(this.duplicateButton, appConst.mediumTimeout);
    }

    async waitForDuplicateButtonDisabled() {
        try {
            await this.waitForElementDisplayed(this.duplicateButton, appConst.mediumTimeout);
            return await this.waitForElementDisabled(this.duplicateButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`'Duplicate' button should be disabled in the Content Wizard`, 'err_duplicate_button_disabled', err);
        }
    }

    async waitForArchiveButtonDisabled() {
        await this.waitForElementDisplayed(this.archiveButton, appConst.mediumTimeout);
        return await this.waitForElementDisabled(this.archiveButton, appConst.mediumTimeout);
    }

    waitForArchiveButtonEnabled() {
        return this.waitForElementEnabled(this.archiveButton, appConst.mediumTimeout);
    }

    async clickOnPreviewButton() {
        try {
            await this.waitForPreviewButtonDisplayed();
            await this.waitForElementEnabled(this.previewButton, appConst.mediumTimeout);
            await this.clickOnElement(this.previewButton);
            return await this.pause(2000);
        } catch (err) {
            await this.handleError(`Tried to click on Preview button`, 'err_preview_button', err);
        }
    }

    waitForPreviewButtonDisplayed() {
        return this.waitForElementDisplayed(this.previewButton, appConst.mediumTimeout);
    }

    // previewItemToolbar
    async waitForPreviewButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.previewButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Preview button should be enabled in the Wizard previewItemToolbar`, 'err_preview_button_enabled', err);
        }
    }

    async waitForPreviewButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.previewButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_button');
            throw new Error(`Preview button should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    waitForValidationPathMessageDisplayed() {
        let locator = XPATH.wizardHeader + `//span[@class='path-error']`;
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async clickOnNameInputOpenModifyPathDialog() {
        await this.waitForModifyPathSpanDisplayed();
        await this.pause(300);
        await this.clickOnElement(this.modifyPathSpan);
        let renamePublishedContentDialog = new RenamePublishedContentDialog();
        await renamePublishedContentDialog.waitForDialogLoaded();
        return renamePublishedContentDialog;
    }

    async moveMouseToModifyPathSpan() {
        let result = await this.findElements(this.modifyPathSpan);
        if (result.length > 0) {
            await result[0].moveTo();
        }
    }

    async waitForModifyPathTooltipDisplayed() {
        try {
            let locator = XPATH.wizardHeader + `//span[contains(@class,'path')]`;
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getAttribute(locator, 'class');
                return text.includes('tooltip_ON');
            }, {timeout: appConst.mediumTimeout, timeoutMsg: `'Click to rename the content' tooltip should be displayed`});
        } catch (err) {
            await this.handleError(`Verify tooltip in the Content Wizard`, 'err_path_input_tooltip', err);
        }
    }

    async waitForModifyPathSpanDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.modifyPathSpan, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_modify_path_span');
            throw new Error(`Modify path span should be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForModifyPathSpanNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.modifyPathSpan, appConst.mediumTimeout);
    }

    async openDetailsWidget() {
        let wizardContextWindow = new WizardContextPanel();
        await this.openContextWindow();
        let option = await wizardContextWindow.getSelectedOptionInWidgetSelectorDropdown();
        if (option !== 'Details') {
            await wizardContextWindow.openDetailsWidget();
        }
    }

    async waitForResetButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.resetButton, appConst.longTimeout);
        } catch (err) {
            await this.handleError(`'Reset' button should be displayed in the Content Wizard`, 'err_reset_button_not_displayed', err);
        }
    }

    waitForResetButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.resetButton, appConst.longTimeout);
    }

    async clickOnResetButton() {
        await this.waitForElementDisplayed(this.resetButton, appConst.longTimeout);
        return await this.clickOnElement(this.resetButton);
    }

    async clickOnResetAndWaitForConfirmationDialog() {
        await this.waitForElementDisplayed(this.resetButton, appConst.longTimeout);
        await this.clickOnElement(this.resetButton);
        let dialog = new ConfirmationDialog();
        await dialog.waitForDialogOpened();
        return dialog;
    }

    async getPageEditorWidth() {
        let widthProperty = await this.getCSSProperty(lib.LIVE_EDIT_FRAME, 'width');
        return widthProperty.value;
    }

    async getPageEditorHeight() {
        let heightProperty = await this.getCSSProperty(lib.LIVE_EDIT_FRAME, 'height');
        return heightProperty.value;
    }

    async waitForDisplayNameInputFocused() {
        try {
            let message = 'Display Name input is not focused in ' + appConst.mediumTimeout;
            await this.getBrowser().waitUntil(async () => {
                return await this.isFocused(this.displayNameInput);
            }, {timeout: appConst.mediumTimeout, timeoutMsg: message});
        } catch (err) {
            await this.handleError(`Verify if Display Name input is focused`, 'err_display_name_focused', err);
        }
    }

    // Check for editor-shader in style attribute:
    async isLiveEditLocked() {
        await this.switchToLiveEditFrame();
        let shaderElement = await this.findElement(XPATH.shaderPage);
        let style = await shaderElement.getAttribute('style');
        return !style.includes('display: none');
    }

    async clickOnGoToGridButton() {
        await this.waitForElementDisplayed(this.goToGridButton, appConst.mediumTimeout);
        await this.clickOnElement(this.goToGridButton);
        return await this.pause(300);
    }

    async getCollaborationUserCompactName() {
        try {
            let locator = XPATH.toolbar + `//div[contains(@id,'CollaborationEl')]//div[contains(@id,'PrincipalViewerCompact')]/span`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Collaboration element should be displayed in the wizard toolbar', 'err_collaboration_icon', err);
        }
    }

    waitForShowChangesButtonDisplayed() {
        return this.waitForElementDisplayed(this.showChangesToolbarButton, appConst.mediumTimeout);
    }

    async clickOnShowChangesToolbarButton() {
        try {
            await this.waitForShowChangesButtonDisplayed();
            await this.clickOnElement(this.showChangesToolbarButton);
        } catch (err) {
            await this.handleError('Tried to click on Show Changes in wizard preview toolbar button', 'err_show_changes_button', err);
        }
    }

    async waitForToolbarRoleAttribute(expectedRole) {
        let locator = XPATH.container + XPATH.toolbar;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedRole);
    }

    async waitForToolbarAriaLabelAttribute() {
        let locator = XPATH.container + XPATH.toolbar;
        await this.waitForAttributeIsPresent(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ARIA_LABEL);
    }

    async waitForProjectViewerAriaLabelAttribute() {
        let locator = XPATH.container + XPATH.projectViewerDiv;
        await this.waitForAttributeIsPresent(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ARIA_LABEL);
    }

    async waitForPublishMenuDropdownRoleAttribute(expectedRole) {
        let locator = XPATH.toolbarPublish + lib.BUTTONS.DROP_DOWN_HANDLE;
        await this.waitForAttributeValue(locator, appConst.ACCESSIBILITY_ATTRIBUTES.ROLE, expectedRole);
    }

    async waitForPreviewWidgetDropdownDisplayed() {
        return await this.waitForElementDisplayed(this.previewWidgetDropdown, appConst.mediumTimeout);
    }

    async selectOptionInPreviewWidget(optionName) {
        try {
            await this.waitForPreviewWidgetDropdownDisplayed();
            await this.clickOnElement(this.previewWidgetDropdown);
            let optionSelector = this.previewWidgetDropdown + lib.DROPDOWN_SELECTOR.listItemByDisplayName(optionName);
            await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
            await this.clickOnElement(optionSelector);
            await this.pause(200);
        } catch (err) {
            await this.handleError(`Preview Widget, tried to select the widget: ${optionName}`, 'err_preview_widget', err);
        }
    }

    // Gets the selected option in the 'Preview dropdown' Auto, Media, etc.
    // Wizard ContentItemPreviewToolbar
    async getSelectedOptionInPreviewWidget() {
        let locator = this.previewWidgetDropdown + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForPreviewButtonDisabled() {
        try {
            await this.waitForPreviewButtonDisplayed();
            await this.waitForElementDisabled(this.previewButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError(`Preview button should be displayed and disabled in the Wizard`, 'err_preview_btn_disabled', err);
        }
    }

    // returns the selected option in the 'Emulator dropdown' '100%', '375px', etc.
    // Wizard ContentItemPreviewToolbar
    async getSelectedOptionInEmulatorDropdown() {
        try {
            let locator = this.emulatorDropdown + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`Error during getting the selected option in Emulator dropdown`, 'err_emulator_dropdown');
        }
    }

    async getNoPreviewMessage() {
        let locator = XPATH.container + lib.LIVE_VIEW.NO_PREVIEW_MSG_SPAN;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async getNoPreviewMessageNoController() {
        let locator = XPATH.container + lib.LIVE_VIEW.NO_CONTROLLER_NO_PREVIEW_MSG_SPAN;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async get500ErrorText() {
        let locator = '//h3';
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async getSelectedWidgetInContextWindow() {
        try {
            let wizardContextPanel = new WizardContextPanel();
            await wizardContextPanel.waitForOpened();
            return await wizardContextPanel.getSelectedOptionInWidgetSelectorDropdown();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_selected_widget');
            throw new Error(`Error when trying to get selected widget in Context Window, screenshot: ${screenshot} ` + err);
        }
    }
}

module.exports = ContentWizardPanel;
