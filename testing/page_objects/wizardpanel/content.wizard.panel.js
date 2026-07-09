/**
 * Created on 5/30/2017.
 */
const Page = require('../page');
const {BUTTONS, DROPDOWN, LIVE_VIEW, WIZARD, COMMON, TREE_GRID} = require('../../libs/elements');
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
const DetailsWidgetInfoSection = require('../browsepanel/detailspanel/details.widget.info.section');
const EditSettingsDialog = require('../details_panel/edit.settings.dialog');
const PageDescriptorDropdown = require('../components/selectors/page.descriptor.dropdown');
const {Key} = require('webdriverio');

const XPATH = {
    container: `//div[contains(@id,'ContentWizardPanel')]`,
    projectViewerDiv: `//div[contains(@id,'ProjectViewer')]`,
    wizardHeader: "//div[contains(@id,'ContentWizardHeader')]",
    showPageEditorTogglerButton: "//button[contains(@id,'ContentActionCycleButton') and @title='Show Page Editor']",
    displayNameInput: "//input[@name='displayName']",
    toolbar: `//div[@data-component='Toolbar.Container' and @role='toolbar']`,
    publishMenuItem: `//div[contains(@id,'ContentWizardToolbar') and @role='menu']`,
    contentItemPreviewToolbar: `//div[contains(@id,'PreviewToolbar')]`,
    toolbarStateIcon: `//div[contains(@class,'toolbar-state-icon')]`,
    // v6: workflow state SVG in the toolbar — aria-label is 'invalid', 'in-progress', or 'ready'
    toolbarWorkflowStateIcon: `//svg[@aria-label and not(@aria-hidden='true')]`,
    publishMenuButton: "//div[contains(@id,'ContentWizardPublishMenuButton')]",
    inspectionPanelToggler: "//button[contains(@id, 'TogglerButton') and contains(@class,'icon-cog')]",
    thumbnailUploader: "//div[contains(@id,'ThumbnailUploaderEl')]",
    scheduleTabBarItem: `//li[contains(@id,'ContentTabBarItem') and @title='Schedule']`,
    itemViewContextMenu: `//div[@data-component='ContextMenu.Content' and @data-state='open']`,
    previewContextMenuTrigger: `//div[contains(@id,'FrameContainer')]//div[@data-component='ContextMenu.Trigger']`,
    pageSettingsMenuItem: `//div[@data-component='ContextMenu.Item' and text()='Page settings']`,
    xDataToggler: `//div[contains(@id,'WizardStepsPanel')]//div[@class='x-data-toggler']`,
    stepNavigatorToolbar: `//ul[contains(@id,'WizardStepNavigator')]`,
    wizardStepNavigatorAndToolbar: "//div[contains(@id,'WizardStepNavigatorAndToolbar')]",
    shaderPage: "//div[@class='xp-page-editor-shader xp-page-editor-page']",
    wizardStepByTitle:
        name => `//div[@data-component='Tab.List']//button[child::span[text()='${name}']]`,
    xDataTogglerByName:
        name => `//div[contains(@id,'WizardStepsPanel')]//div[contains(@id,'ContentPanelStripHeader') and child::span[contains(.,'${name}')]]//button[contains(@class,'toggler-button')]`,
    publishMenuItemByName(name) {
        return `//div[contains(@id,'ContentWizardToolbar') and @role='menu']//div[@role='menuitem' and .//span[text()='${name}']]`;
    },
    previewToolbarMenuItem: (optionName) => {
        return `//div[contains(@id,'PreviewToolbar') and @role='menu']//div[@role='menuitemradio' and descendant::span[text()='${optionName}']]`
    },
    openRenameDialogButton: name => `//button[@data-component='Tooltip' and child::span[text()='${name}']]`,
    nameInToolbarButton: `//button[@data-component='Tooltip' and contains(@id,'toolbar-item')]/span`,
    publishMenuItemByName(name) {
        return `//div[@data-component='Menu.Item' and child::span[text()='${name}']]`;
    },
    xDataMenuTrigger: `//button[@data-component='Menu.Trigger' and @aria-label='Toggle mixin']`,
    xDataMenuItem: (name) => `//div[@data-component='Menu.Content']//div[@data-component='Menu.Item' and child::span[text()='${name}']]`,
    xDataMenuConfirmButton: `//div[@data-component='Menu.Content']//button[@aria-label='Confirm']`,
};

class ContentWizardPanel extends Page {

    get previewItemToolbar() {
        return XPATH.container + XPATH.contentItemPreviewToolbar;
    }

    get markAsReadyButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Mark as ready');
    }

    get publishTreeButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Publish tree');
    }

    get createIssueButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Create issue');
    }

    get emulatorDropdown() {
        return this.previewItemToolbar + BUTTONS.buttonAriaLabel('Open emulator selector');
    }

    get previewWidgetDropdown() {
        return this.previewItemToolbar + BUTTONS.buttonAriaLabel('Open widget selector');
    }

    get displayNameInput() {
        return XPATH.container + WIZARD.DISPLAY_NAME_INPUT;
    }

    get displayNameControl() {
        return XPATH.container + WIZARD.DISPLAY_NAME_CONTROL;
    }

    get modifyPathSpan() {
        return XPATH.wizardHeader + COMMON.RENAME_CONTENT_SPAN;
    }

    get pathInput() {
        return XPATH.container + WIZARD.PATH_INPUT;
    }

    get collapseContentFormButton() {
        return COMMON.CONTENT_WIZARD_DATA_COMPONENT + LIVE_VIEW.MINIMIZE_BUTTON;
    }

    get expandContentFormButton() {
        return LIVE_VIEW.EXPAND_CONTENT_BUTTON;
    }

    get pageEditorTogglerButton() {
        return XPATH.toolbar + LIVE_VIEW.PAGE_EDITOR_TOGGLE_BUTTON;
    }

    get detailsPanelToggleButton() {
        return XPATH.container + COMMON.CONTEXT_WINDOW_TOGGLE_BUTTON;
    }

    get saveButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Save');
    }

    get resetButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Reset');
    }

    get savedButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Saved');
    }

    get savingButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Saving...');
    }

    get publishButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.buttonAriaLabel('Publish');
    }

    get publishDropDownHandle() {
        return XPATH.toolbar + "//div[contains(@class,'justify-end')]//button[@aria-label='More actions']";
    }

    get thumbnailUploader() {
        return XPATH.container + XPATH.thumbnailUploader;
    }

    get unpublishButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Unpublish');
    }

    get showChangesToolbarButton() {
        return this.previewItemToolbar + XPATH.showChangesButtonToolbar;
    }

    get workflowIconAndValidation() {
        return this.thumbnailUploader + `//div[contains(@class, 'workflow-status')]`;
    }

    get deleteButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Delete');
    }

    get duplicateButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Duplicate');
    }

    get localizeButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Localize');
    }

    // Preview button on the previewItemToolbar
    get previewButton() {
        return XPATH.container + XPATH.toolbar + BUTTONS.toolbarButtonAriaLabel('Preview');
    }

    get wizardToolbarHelpButton() {
        return XPATH.wizardStepNavigatorAndToolbar + lib.HELP_TEXT.BUTTON;
    }

    get goToGridButton() {
        return XPATH.toolbar + XPATH.goToGridButton;
    }

    get versionHistoryButton() {
        return this.previewItemToolbar + BUTTONS.buttonAriaLabel('Open version history');
    }

    async waitForVersionHistoryButtonDisplayed() {
        return await this.waitForElementDisplayed(this.versionHistoryButton);
    }

    async waitForHelpTextsButtonTogglerDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.wizardToolbarHelpButton);
        } catch (err) {
            await this.handleError(`'Help texts' toggle button is not displayed in the Content Wizard`, 'err_help_text_button', err);
        }
    }

    async waitForLocalizeButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.localizeButton);
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
            await versionPanel.waitForLoaded();
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

    async isWizardStepPresent(stepName) {
        try {
            let locator = XPATH.container + XPATH.wizardStepByTitle(stepName);
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            return true;
        } catch (err) {
            console.log(`Wizard step is not visible:${stepName} `);
            return false;
        }
    }

    async waitForWizardStepDisplayed(stepName) {
        try {
            let locator = XPATH.container + XPATH.wizardStepByTitle(stepName);
            return await this.waitForElementDisplayed(locator);
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
            return await this.waitForElementDisplayed(this.detailsPanelToggleButton);
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
            await this.waitForElementDisplayed(this.displayNameControl, appConst.longTimeout);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Content wizard should be opened', 'err_wizard_opened', err);
        }
    }

    // exception will be thrown if Save button is disabled after 3 seconds
    async waitForSaveButtonEnabled() {
        try {
            await this.waitForSaveButtonVisible();
            let elements = await this.getDisplayedElements(this.saveButton);
            await elements[0].waitForEnabled({timeout: appConst.shortTimeout});
        } catch (err) {
            await this.handleError(`'Save' button should be enabled in the Content Wizard`, 'err_save_button_enabled', err);
        }
    }

    async waitForSaveButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.saveButton);
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
            await this.waitForElementDisplayed(this.savedButton);
            return await this.waitForElementDisabled(this.savedButton);
        } catch (err) {
            await this.handleError(`'Saved' button is not visible or it is not disabled`, 'err_saved_button_not_visible', err);
        }
    }

    switchToLiveEditFrame() {
        return this.switchToFrame(LIVE_VIEW.LIVE_EDIT_FRAME);
    }

    switchToEmptyLiveEditFrame() {
        return this.switchToFrame(LIVE_VIEW.EMPTY_LIVE_FRAME_DIV);
    }

    waitForLiveEditVisible() {
        return this.waitForElementDisplayed(LIVE_VIEW.LIVE_EDIT_FRAME, appConst.mediumTimeout);
    }

    async getLiveFramePosition() {
        let el = await this.findElement(LIVE_VIEW.LIVE_EDIT_FRAME);
        let xValue = parseInt(await el.getLocation('x'));
        let yValue = parseInt(await el.getLocation('y'));
        return {x: xValue, y: yValue};
    }

    async typeDisplayName(displayName) {
        await this.openDisplayNameEditor();
        return await this.typeTextInInput(this.displayNameInput, displayName);
    }

    async openDisplayNameEditor() {
        try {
            if (await this.isElementDisplayed(this.displayNameInput)) {
                return;
            }

            await this.waitForElementDisplayed(this.displayNameControl);
            await this.clickOnElement(this.displayNameControl);
            await this.waitForElementDisplayed(this.displayNameInput);
        } catch (err) {
            await this.handleError('Error when trying to open display name editor', 'err_open_display_name_editor', err);
        }
    }

    async getDisplayName() {
        if (await this.isElementDisplayed(this.displayNameInput)) {
            return await this.getTextInInput(this.displayNameInput);
        }

        return await this.getText(this.displayNameControl);
    }

    // rename button:
    async getNameInToolbar() {
        let locator = XPATH.toolbar + XPATH.nameInToolbarButton;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getText(locator);
    }

    async clearDisplayNameInput() {
        await this.openDisplayNameEditor();
        return await this.clearInputText(this.displayNameInput);
    }

    async isSaveButtonDisabled() {
        return !(await this.isElementEnabled(this.saveButton));
    }

    async waitAndClickOnSave() {
        try {
            await this.waitForSaveButtonEnabled();
            await this.clickOnElement(this.saveButton);
            await this.waitForSavingButtonNotVisible();
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Error in waitAndClickOnSave', 'err_save_content', err);
        }
    }

    async waitForSavingButtonNotVisible() {
        return await this.waitForElementNotDisplayed(this.savingButton);
    }

    async clickOnDeleteButton() {
        try {
            await this.waitForDeleteButtonEnabled();
            return await this.clickOnElement(this.deleteButton);
        } catch (err) {
            await this.handleError('Error when trying to click on Delete button', 'err_delete_button_wizard', err);
        }
    }

    // clicks on 'Publish...' button
    async clickOnPublishButton() {
        try {
            await this.waitForElementDisplayed(this.publishButton);
            await this.waitForElementEnabled(this.publishButton);
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

    async waitForPublishMenuDropdownHandleDisabled() {
        await this.waitForElementDisabled(this.publishDropDownHandle);
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
        let selector = XPATH.publishMenuItemByName(menuItem);
        return await this.getBrowser().waitUntil(async () => {
            let ariaDisabled = await this.getAttribute(selector, 'aria-disabled');
            return !ariaDisabled || ariaDisabled !== 'true';
        }, {timeout: appConst.shortTimeout, timeoutMsg: `Menu item "${menuItem}" should be enabled`});
    }

    async waitForPublishMenuItemDisabled(menuItem) {
        let selector = XPATH.publishMenuItemByName(menuItem);
        return await this.getBrowser().waitUntil(async () => {
            let ariaDisabled = await this.getAttribute(selector, 'aria-disabled');
            return ariaDisabled === 'true';
        }, {timeout: appConst.shortTimeout, timeoutMsg: `Menu item "${menuItem}" should be disabled`});
    }

    async isContentInvalid() {
        try {
            return await this.getContentWorkflowState() === 'invalid';
        } catch (err) {
            await this.handleError(`Error when trying to check if content is invalid`, 'err_wizard_validation', err);
        }
    }

    async waitUntilInvalidIconAppears() {
        try {
            const locator = XPATH.container + XPATH.toolbar + "//*[@data-component='StatusIcon']";
            await this.getBrowser().waitUntil(async () => {
                let text = await this.getAttribute(locator, 'aria-label');
                return text === 'invalid';
            }, {timeout: appConst.shortTimeout, timeoutMsg: "Content wizard - invalid icon should appear"});
        } catch (err) {
            await this.handleError('Validation Error: invalid-icon did not appear in content-wizard', 'err_wizard_validation', err);
        }
    }

    async waitUntilInvalidIconDisappears() {
        const locator = XPATH.container + XPATH.toolbar + "//*[@data-component='StatusIcon']";
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(locator, 'aria-label');
            return text !== 'invalid';
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Content wizard - invalid icon should disappear"});
    }

    async typeSettings(settings) {
        let detailsWidgetInfoSection = new DetailsWidgetInfoSection();
        let editSettingsDialog = new EditSettingsDialog();
        if (settings.language) {
            await detailsWidgetInfoSection.clickOnEditSettingsButton();
            await editSettingsDialog.waitForLoaded();
            await editSettingsDialog.filterOptionsAndSelectLanguage(settings.language);
            await editSettingsDialog.clickOnApplyButton();
            await editSettingsDialog.waitForClosed();
        }
    }

    // Opens the preview context menu and clicks on 'Page settings' item
    async openLockedSiteContextMenuClickOnPageSettings() {
        await this.doOpenItemViewContextMenu();
        await this.saveScreenshot(appConst.generateRandomName('unlock_context_menu'));
        return await this.clickOnPageSettingsMenuItem();
    }

    // Opens context menu with 'Page Settings' with contentName in its title
    async doOpenPageViewContextMenu(contentName) {
        try {
            await this.doOpenItemViewContextMenu();
            let menuLocator = XPATH.itemViewContextMenu + `[descendant::span[contains(@class,'truncate') and text()='${contentName}']]`;
            await this.waitForElementDisplayed(menuLocator, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Content wizard, tried to open Page View Context Menu(Page Setting)', 'err_page_view_context_menu', err);
        }
    }

    // Opens context menu with 'Page Settings' item
    async doOpenItemViewContextMenu() {
        try {
            // The menu opens on a click on the preview placeholder (ContextMenu.Trigger) and is rendered
            // in the main document, so no switching to the live edit frame here.
            // Both empty- and error-preview placeholders contain a trigger, click the visible one:
            let triggerElements = [];
            await this.getBrowser().waitUntil(async () => {
                triggerElements = await this.getDisplayedElements(XPATH.previewContextMenuTrigger);
                return triggerElements.length > 0;
            }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Preview placeholder with context menu trigger should be displayed'});
            await triggerElements[0].click();
            await this.waitForElementDisplayed(XPATH.itemViewContextMenu, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Content wizard, tried to open Item View Context Menu', 'err_item_view_context_menu', err);
        }
    }

    // wait for 'Page settings' context menu item and click on it:
    async clickOnPageSettingsMenuItem() {
        let locator = XPATH.itemViewContextMenu + XPATH.pageSettingsMenuItem;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    async waitForPageSettingsMenuItemDisplayed() {
        try {
            let locator = XPATH.itemViewContextMenu + XPATH.pageSettingsMenuItem;
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Universal Editor - Page settings menu item is not displayed', 'err_page_settings_menu_item', err);
        }
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
            await this.waitForElementDisplayed(this.displayNameControl, appConst.shortTimeout);

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
            if (content.settings &&
                (content.settings.language !== undefined || content.settings.owner !== undefined)) {
                // TODO change it Enonic ui
                await this.waitAndClickOnSave();//
                await this.waitForNotificationMessage();//
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
            await this.handleError('Content Wizard, Failed to fill content data.', 'err_type_content_data', err);
        }
    }


    async openPublishMenu() {
        await this.clickOnElement(this.showPublishMenuButton);
        return await this.pause(500);
    }

    async clickOnPublishMenuDropdownHandle() {
        try {
            await this.waitForElementDisplayed(this.publishDropDownHandle);
            await this.clickOnElement(this.publishDropDownHandle);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Content wizard, tried to click on Publish menu dropdown handle', 'err_click_on_dropdown', err);
        }
    }

    async clickOnUnpublishMenuItem() {
        try {
            await this.clickOnPublishMenuDropdownHandle();
            let locator = XPATH.publishMenuItemByName('Unpublish');
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError('Content wizard, tried to click on unpublish menu item', 'err_unpublish_menu_item', err);
        }
    }

    async waitForCollapseContentFormButtonDisplayed() {
        await this.waitForElementDisplayed(this.collapseContentFormButton);
        await this.pause(500);
    }

    async waitForExpandContentFormButtonDisplayed() {
        await this.waitForElementDisplayed(this.expandContentFormButton);
        await this.pause(500);
    }

    async clickOnCollapseContentForm() {
        try {
            await this.waitForCollapseContentFormButtonDisplayed();
            await this.clickOnElement(this.collapseContentFormButton);
            await this.pause(400);
        } catch (err) {
            await this.handleError('Content wizard, tried to click on minimize live edit toggle', 'err_minimize_icon', err);
        }
    }

    async clickOnExpandContentForm() {
        try {
            await this.waitForExpandContentFormButtonDisplayed();
            await this.clickOnElement(this.expandContentFormButton);
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
            return await this.waitForElementDisplayed(this.publishDropDownHandle);
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
    async getContentStatusInToolbar() {
        try {
            let locator = XPATH.container + XPATH.toolbar + TREE_GRID.CONTENT_STATUS;
            let result = await this.getDisplayedElements(locator);
            return await result[0].getText();
        } catch (err) {
            await this.handleError(`Tried to get the content-status from the Item Wizard toolbar`, 'err_get_content_status', err);
        }
    }

    async waitForContentStatusInToolbar(status) {
        try {
            let locator = XPATH.container + `//span[contains(@data-component,'StatusBadge') and text()='${status}']`;
            await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError(`Incorrect content-status in the Item Wizard toolbar`, 'err_wizard_content_status', err);
        }
    }

    // Waits until content status in the Item Preview toolbar equals to expectedStatus
    async waitForContentStatusInPreviewPanel(expectedStatus) {
        try {
            let locator = this.versionHistoryButton + `//span[text()='${expectedStatus}']`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
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

    async openPublishMenu() {
        await this.waitForShowPublishMenuButtonVisible();
        await this.clickOnElement(this.publishDropDownHandle);
        await this.pause(500);
    }

    async openPublishMenuSelectItem(menuItem) {
        try {
            await this.waitForShowPublishMenuButtonVisible();
            await this.clickOnElement(this.publishDropDownHandle);
            let selector = XPATH.publishMenuItemByName(menuItem);
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

    async openPublishMenuAndCreateRequestPublish(title, assignees) {
        let createRequestPublishDialog = new CreateRequestPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await contentWizardPanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await createRequestPublishDialog.waitForDialogLoaded();
        await createRequestPublishDialog.typeInTitleInput(title);
        return await createRequestPublishDialog.clickOnCreateRequestButton();
    }

    async waitForPublishTreeButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.publishTreeButton);
        } catch (err) {
            await this.handleError('Publish Tree button should be visible', 'err_publish_tree_button', err);
        }
    }

    async clickOnPublishTreeButton() {
        try {
            await this.waitForPublishTreeButtonDisplayed();
            await this.clickOnElement(this.publishTreeButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Tried to click on 'Mark As Ready' button`, 'err_mark_as_ready_button', err);
        }
    }

    async clickOnMarkAsReadyButton() {
        try {
            await this.waitForMarkAsReadyButtonVisible();
            await this.pause(300);
            await this.clickOnElement(this.markAsReadyButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Tried to click on 'Mark As Ready' button`, 'err_mark_as_ready_button', err);
        }
    }

    async clickOnUnpublishButton() {
        try {
            await this.waitForUnpublishButtonDisplayed();
            await this.clickOnElement(this.unpublishButton);
            let unpublishDialog = new ContentUnpublishDialog();
            await unpublishDialog.waitForDialogOpened();
            return unpublishDialog;
        } catch (err) {
            await this.handleError(`Tried to click on 'Unpublish' button`, 'err_unpublish_button', err);
        }
    }

    async waitForUnpublishButtonDisplayed() {
        return await this.waitForElementDisplayed(this.unpublishButton, appConst.longTimeout);
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
            await this.waitForElementDisplayed(this.createIssueButton, appConst.shortTimeout);
            await this.waitForElementEnabled(this.createIssueButton, appConst.shortTimeout);
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

    // Returns 'invalid', 'in-progress', 'ready', or '' when the icon is absent (e.g. Published)
    async getContentWorkflowState() {
        try {
            const toolbar = XPATH.container + XPATH.toolbar + "//*[@data-component='StatusIcon']";
            let result = await this.getDisplayedElements(toolbar);
            let value = await result[0].getAttribute('aria-label');
            return value;
        } catch (err) {
            await this.handleError(`Tried to get content workflow state from the toolbar`, 'err_get_workflow_state', err);
        }
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
        let selector = XPATH.toolbar + `//button[@data-component='Toolbar.Item']//span[contains(@class,'lg:flex')]`;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        return await this.getText(selector);
    }

    isDisplayNameInputClickable() {
        return this.isClickable(this.displayNameControl);
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

    async waitForDeleteButtonDisabled() {
        await this.waitForElementDisplayed(this.deleteButton, appConst.mediumTimeout);
        return await this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout);
    }

    async clickOnPreviewButton() {
        try {
            await this.waitForPreviewButtonDisplayed();
            await this.waitForElementEnabled(this.previewButton, appConst.mediumTimeout);
            await this.clickOnElement(this.previewButton);
            return await this.pause(2000);
        } catch (err) {
            await this.handleError(`Tried to click on Preview button`, 'err_click_preview_btn', err);
        }
    }

    async waitForPreviewButtonDisplayed() {
        return await this.waitForElementDisplayed(this.previewButton, appConst.mediumTimeout);
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

    async waitForValidationPathMessageDisplayed() {
        let locator = XPATH.nameInToolbarButton + `[contains(@class,'text-error')]`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async clickOnRenameNameButton(name) {
        //await this.waitForModifyPathSpanDisplayed();
        await this.clickOnRenameContentDialogButton(name);
        await this.pause(300);
        //await this.clickOnElement(this.modifyPathSpan);
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

    async getCollaborationUserCompactName() {
        try {
            let locator = XPATH.toolbar + `//div[contains(@id,'CollaborationEl')]//div[contains(@id,'PrincipalViewerCompact')]/span`;
            await this.waitForElementDisplayed(locator);
            return await this.getTextInElements(locator);
        } catch (err) {
            await this.handleError('Collaboration element should be displayed in the wizard toolbar', 'err_collaboration_icon', err);
        }
    }

    async clickOnVersionHistoryButton() {
        try {
            await this.waitForVersionHistoryButtonDisplayed();
            await this.clickOnElement(this.versionHistoryButton);
        } catch (err) {
            await this.handleError('Tried to click on Version history in wizard preview toolbar button', 'err_version_history_btn', err);
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

    async waitForPreviewWidgetDropdownDisplayed() {
        return await this.waitForElementDisplayed(this.previewWidgetDropdown);
    }

    async selectOptionInPreviewWidget(optionName) {
        try {
            await this.waitForPreviewWidgetDropdownDisplayed();
            await this.clickOnElement(this.previewWidgetDropdown);
            let optionSelector = XPATH.previewToolbarMenuItem(optionName);
            await this.waitForElementDisplayed(optionSelector);
            await this.clickOnElement(optionSelector);
            await this.pause(200);
        } catch (err) {
            await this.handleError(`Preview Widget, tried to select the widget: ${optionName}`, 'err_preview_widget', err);
        }
    }

    // Gets the selected option in the 'Preview dropdown' Auto, Media, etc.
    // Wizard ContentItemPreviewToolbar
    async getSelectedOptionInPreviewWidget() {
        try {
            let locator = this.previewWidgetDropdown;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`Content Wizard, Tried to get the selected option in Preview Widget`, 'err_prev_widget_dropdown', err);
        }
    }

    async waitForPreviewButtonDisabled() {
        try {
            await this.waitForPreviewButtonDisplayed();
            await this.waitForElementDisabled(this.previewButton);
        } catch (err) {
            await this.handleError(`Preview button should be displayed and disabled in the Wizard`, 'err_preview_btn_disabled', err);
        }
    }

    // returns the selected option in the 'Emulator dropdown' '100%', '375px', etc.
    // Wizard ContentItemPreviewToolbar
    async getSelectedOptionInEmulatorDropdown() {
        try {
            let locator = this.emulatorDropdown;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`Error during getting the selected option in Emulator dropdown`, 'err_emulator_dropdown');
        }
    }

    async getNoPreviewMessage() {
        let locator = XPATH.container + LIVE_VIEW.PREVIEW_NOT_AVAILABLE_SPAN;
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

    async clickOnNavigateToBrowsePanelButton(projectName) {
        let locator =
            XPATH.container + `//div[@role='toolbar']//button[@aria-label='${projectName}']`;
        try {
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Tried to click on 'Navigate to Browse Panel' button with project name: ${projectName}`,
                'err_navigate_to_browse_panel', err);
        }
    }

    async clickOnRenameContentDialogButton(path) {
        let locator = XPATH.toolbar + XPATH.openRenameDialogButton(path);
        await this.waitForElementDisplayed(locator);
        await this.clickOnElement(locator);
    }

    async waitForPublishMenuItemEnabled(menuItem) {
        try {
            // Enabled items have no aria-disabled attribute; disabled ones have aria-disabled='true'.
            let selector = XPATH.publishMenuItemByName(menuItem) + "[not(@aria-disabled='true')]";
            return await this.waitForElementDisplayed(selector);
        } catch (err) {
            await this.handleError(`${menuItem} should be enabled`, 'err_publish_menuItem_enabled', err);
        }
    }

    async getPageEditorOverlayShadowHost() {
        const host = await this.findElement(COMMON.SHADOW_SELECTORS.PAGE_EDITOR_OVERLAY_HOST);
        await host.waitForExist({timeout: appConst.mediumTimeout});
        return host;
    }

    async unlockSiteWithTemplate() {
        try {
            let selector = `//div[contains(@id,'FrameContainer')]`;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            await this.switchToLiveEditFrame();
            const host = await this.getPageEditorOverlayShadowHost();
            const items = await host.shadow$$(COMMON.SHADOW_SELECTORS.CONTEXT_MENU_ITEM);
            for (const item of items) {
                const text = await item.getText();
                if (text.trim() === 'Page settings') {
                    await item.click();
                    return await this.pause(500);
                }
            }
            throw new Error("'Page settings' context menu item was not found in shadow DOM");
        } catch (err) {
            await this.handleError('Content Wizard, unlock site with template:', 'err_unlock_site_template', err);
        }
    }

    async clickOnXdataMenuTrigger() {
        try {
            await this.waitForElementDisplayed(XPATH.xDataMenuTrigger, appConst.mediumTimeout);
            await this.clickOnElement(XPATH.xDataMenuTrigger);
            await this.waitForElementDisplayed(XPATH.xDataMenuItem(''), appConst.shortTimeout).catch(() => {
            });
        } catch (err) {
            await this.handleError('Content Wizard, xdata menu trigger', 'err_xdata_menu_trigger', err);
        }
    }

    async clickOnXdataMenuItemCheckbox(menuName) {
        try {
            let selector = XPATH.xDataMenuItem(menuName);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Content Wizard, xdata menu item: ${menuName}`, 'err_xdata_menu_item', err);
        }
    }

    async waitForConfirmXdataButtonEnabled() {
        await this.waitForElementEnabled(XPATH.xDataMenuConfirmButton);
    }

    async clickOnConfirmXdataButton() {
        try {
            await this.waitForElementDisplayed(XPATH.xDataMenuConfirmButton);
            await this.clickOnElement(XPATH.xDataMenuConfirmButton);
            await this.waitForElementNotDisplayed(XPATH.xDataMenuConfirmButton);
        } catch (err) {
            await this.handleError('Content Wizard, xdata menu confirm button', 'err_xdata_menu_confirm', err);
        }
    }
}

module.exports = ContentWizardPanel;
