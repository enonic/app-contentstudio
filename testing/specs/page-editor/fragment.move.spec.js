/**
 * Created on 06.04.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const TextComponent = require('../../page_objects/components/text.component');
const appConst = require('../../libs/app_const');
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe('Move Fragment specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE, FOLDER;
    const CONTROLLER_NAME = 'main region';
    const FRAGMENT_TEXT_DESCRIPTION = 'text';
    const TEST_TEXT_FRAGMENT = appConst.generateRandomName('text');

    it(`Preconditions: new site and folder should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            let folderName = contentBuilder.generateRandomName('folder');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
            FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.doAddFolder(FOLDER);
        });

    // Verifies - Incorrect description in fragment item after a component has been saved as fragment. https://github.com/enonic/app-contentstudio/issues/1534
    it(`WHEN text-component has been saved as fragment THEN new Fragment-content should be created`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponent = new TextComponent();
            // 1. Open existing site and insert new text component with the text:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponent.typeTextInCkeEditor(TEST_TEXT_FRAGMENT);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1500);
            // 2. wait for (1500) the page is rendered and open the menu
            await pageComponentView.openMenu(TEST_TEXT_FRAGMENT);
            // 3. Click on Save as Fragment menu item:
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await studioUtils.saveScreenshot('text_saved_as_fragment2');
            // 4. Wait for the description is refreshing:
            await contentWizard.pause(5500);
            // 5. Go to the site-wizard and verify description of the new created fragment
            let actualDescription = await pageComponentView.getComponentDescription(TEST_TEXT_FRAGMENT);
            assert.equal(actualDescription, FRAGMENT_TEXT_DESCRIPTION, 'Expected description should be in the text-fragment');
        });

    it(`WHEN existing fragment is selected AND 'Automatic' is selected in Preview Panel THEN expected text-fragment should be displayed in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the fragment-content and click on Move button:
            await studioUtils.findAndSelectItemByDisplayName(TEST_TEXT_FRAGMENT);
            // 2. Verify that Automatic option is selected:
            await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            let actualOption = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
            // 3. Verify that 'Preview' button should be enabled:
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let result = await contentItemPreviewPanel.getTextFromTextComponent();
            assert.equal(result, TEST_TEXT_FRAGMENT, "expected text should be present in the Preview Panel");
        });

    it(`WHEN existing fragment is selected AND 'Site engine' is selected in Preview Panel THEN expected text-fragment should be displayed in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the fragment-content:
            await studioUtils.findAndSelectItemByDisplayName(TEST_TEXT_FRAGMENT);
            // 2. Select 'Site engine' in the dropdown
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.SITE_ENGINE);
            // 3. Verify the Preview button should be enabled:
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            // 4. Verify the text-fragment should be displayed in the Preview Panel
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let result = await contentItemPreviewPanel.getTextFromTextComponent();
            assert.equal(result, TEST_TEXT_FRAGMENT, "expected text should be present in the Preview Panel");
        });

    it(`WHEN existing fragment is selected AND 'Media' is selected in Preview Panel THEN expected message should be displayed in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the fragment-content:
            await studioUtils.findAndSelectItemByDisplayName(TEST_TEXT_FRAGMENT);
            await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            // 2. Select 'Media' in the dropdown
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            // 3. Verify the message:  'Can not render non-media content'
            let messages = await contentItemPreviewPanel.getNoPreviewMessage();
            assert.ok(messages.includes(appConst.PREVIEW_PANEL_MESSAGE.CAN_NOT_RENDER_NON_MEDIA),
                "Expected message should be displayed in Content Item Preview panel");
        });

    // Verify - Disable Move button when target is not selected #6763
    it(`GIVEN fragment is selected AND Move button has been pressed WHEN target is not selected THEN 'Move' button should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            // 1. Select the fragment-content and click on Move button:
            await studioUtils.findAndSelectItemByDisplayName(TEST_TEXT_FRAGMENT);
            await contentBrowsePanel.clickOnMoveButton();
            // 2. Verify - modal dialog is loaded:
            await moveContentDialog.waitForOpened();
            // 3. Move button should be disabled, target is not selected:
            await moveContentDialog.waitForMoveButtonDisabled();
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/6823
    // Move content dialog - Move button is disabled after closing Confirmation dialog #6823
    it(`GIVEN existing text-fragment is selected WHEN 'Move' button has been pressed and the action is confirmed THEN the fragment should be moved to the root directory`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Select the fragment-content and click on Move button:
            await studioUtils.findAndSelectItemByDisplayName(TEST_TEXT_FRAGMENT);
            await contentBrowsePanel.clickOnMoveButton();
            // 2. Verify -  modal dialog is loaded
            await moveContentDialog.waitForOpened();
            // 3. Select a target:
            await moveContentDialog.typeTextAndClickOnOption(FOLDER.displayName);
            // 4. Verify that 'Move' button gets enabled:
            await moveContentDialog.waitForMoveButtonEnabled();
            await moveContentDialog.clickOnMoveButton();
            // 5. Verify - Confirmation dialog should be loaded
            await confirmationDialog.waitForDialogOpened();
            // 6. Click on 'Yes' button:
            await confirmationDialog.clickOnNoButton();
            await studioUtils.saveScreenshot('fragment_confirmation_no');
            // 7. Verify that Move-Content dialog remains visible and 'Move' button is enabled:
            await moveContentDialog.waitForMoveButtonEnabled();
        });

    // Verifies: app-contentstudio#22 Confirmation dialog does not appear, when a fragment is filtered
    it(`GIVEN existing text-fragment is selected WHEN 'Move' button has been pressed and the action is confirmed THEN the fragment should be moved to the root directory`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Select the fragment-content and click on Move button:
            await studioUtils.findAndSelectItemByDisplayName(TEST_TEXT_FRAGMENT);
            await contentBrowsePanel.clickOnMoveButton();
            // 2. Verify -  modal dialog is loaded
            await moveContentDialog.waitForOpened();
            // 3. Select a target:
            await moveContentDialog.typeTextAndClickOnOption(FOLDER.displayName);
            await studioUtils.saveScreenshot('move_dlg_enabled');
            // 4. Verify that Move button gets enabled:
            await moveContentDialog.waitForMoveButtonEnabled();
            await moveContentDialog.clickOnMoveButton();
            // 5. Verify - Confirmation dialog should be loaded!
            await confirmationDialog.waitForDialogOpened();
            // 6. Click on 'Yes' button:
            await confirmationDialog.clickOnYesButton();
            // 7. Verify the notification message - "You are about to move content out of its site which might make it unreachable. Are you sure?"
            await studioUtils.saveScreenshot('fragment_is_moved');
            let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(actualMessage, `1 item(s) were moved to`, 'Expected notification message should appear');
            let actionLinkText = await contentBrowsePanel.waitForNotificationActionsText();
            assert.equal(actionLinkText, `/${FOLDER.displayName}`, "Expected text should be present in the actions link");
        });

    // Verifies - Exception thrown after opening a moved fragment #6822
    // https://github.com/enonic/app-contentstudio/issues/6822
    it(`WHEN existing moved text-fragment is opened THEN the fragment should be loaded in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Select and open the moved fragment:
            await studioUtils.selectContentAndOpenWizard(TEST_TEXT_FRAGMENT);
            // 2. Verify - wizard is loaded:
            await contentWizard.waitForOpened();
            // 3. Verify - expected name should be displayed in the fragment wizard
            let actualDisplayName = await contentWizard.getDisplayName();
            assert.equal(actualDisplayName, TEST_TEXT_FRAGMENT, 'Expected fragment should be loaded in the wizard');
        });

    // Verifies -  https://github.com/enonic/app-contentstudio/issues/1472 - Site wizard does not load after deleting its child fragment:
    // Edit and Detach from fragment menu items should be disabled for removed fragments #6800
    it(`WHEN existing text-fragment is deleted AND its parent site has been opened THEN wizard page should be loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let deleteContentDialog = new DeleteContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Select the fragment-content and delete it:
            await studioUtils.findAndSelectItemByDisplayName(TEST_TEXT_FRAGMENT);
            // Open 'Delete Content' modal dialog:
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnIgnoreInboundReferences();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await deleteContentDialog.waitForDialogClosed();
            // 2. Open fragment's parent site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.waitForOpened();
            //  Verify - 'Edit' and 'Detach' from fragment menu items should be disabled for removed fragments #6800
            await pageComponentsWizardStepForm.openMenu('Fragment');
            await studioUtils.saveScreenshot('removed_fragment_context_menu');
            await pageComponentsWizardStepForm.waitForContextMenuItemDisabled(appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT);
            await pageComponentsWizardStepForm.waitForContextMenuItemDisabled(appConst.COMPONENT_VIEW_MENU_ITEMS.DETACH_FROM_FRAGMENT);
            // Verify - These menu items should be enabled: Remove, Duplicate, Reset, Inspect, Insert, Select Parent
            await pageComponentsWizardStepForm.waitForContextMenuItemEnabled(appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE);
            await pageComponentsWizardStepForm.waitForContextMenuItemEnabled(appConst.COMPONENT_VIEW_MENU_ITEMS.DUPLICATE);
            await pageComponentsWizardStepForm.waitForContextMenuItemEnabled(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
            await pageComponentsWizardStepForm.waitForContextMenuItemEnabled(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT);
            await pageComponentsWizardStepForm.waitForContextMenuItemEnabled(appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT);
            await pageComponentsWizardStepForm.waitForContextMenuItemEnabled(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
