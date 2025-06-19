/**
 * Created on 03.08.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');

describe('shortcut.page.editor.spec: tests for displaying Page Editor for shortcuts', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const SHORTCUT_NAME = appConst.generateRandomName('shortcut');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });


    it(`GIVEN wizard for new child shortcut is opened WHEN the parent site with a controller has been selected in target THEN 'Preview' button should not be displayed in the wizard toolbar`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.SHORTCUT);
            // 1. Type a shortcut name:
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            // 2. Select the site with a controller in the target selector:
            await shortcutForm.filterOptionsAndSelectTarget(SITE.displayName);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('shortcut_target_site_with_controller');
            // 4. Details option should be selected in the widget selector dropdown:
            let selectedOption = await wizardDetailsPanel.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(selectedOption, 'Details', "'Details' selected option should be in the widget selector");
        });

    it(`GIVEN existing shortcut has been opened WHEN Show Page Editor button has been clicked THEN 'Preview' button should be disabled in the Preview Item toolbar`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_NAME);
            // 1. 'Show page editor' toggle should be displayed, click on it and open the Editor
            await contentWizard.clickOnPageEditorToggler();
            // 2. Verify the selected option in Preview Widget
            let actualOption = await contentWizard.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
            let actualSize = await contentWizard.getSelectedOptionInEmulatorDropdown()
            assert.equal(actualSize, appConst.EMULATOR_RESOLUTION_VALUE.FULL_SIZE,
                '100% should be selected in emulator dropdown by default');
            // 3. Verify that 'Preview' button should be disabled in the wizard PreviewItem toolbar:
            await contentWizard.waitForPreviewButtonDisabled();
        });

    // When preview request for a selected content returns 3xx code, show our standard "Preview not unavailable" message instead of showing the redirect target content as now.
    // https://github.com/enonic/app-contentstudio/issues/4294
    it(`WHEN existing shortcut to the site with controller is selected THEN 'Preview not available' is displayed in Preview panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing shortcut:
            await studioUtils.findAndSelectItem(SHORTCUT_NAME);
            await studioUtils.saveScreenshot('preview_not_available_shortcut');
            // 2. Verify that 'Preview not available' is displayed in Preview panel
            await contentItemPreviewPanel.waitForPreviewNotAvailAbleMessageDisplayed();
            // 3. 'Preview' button should be disabled in the ItemPreviewPanel toolbar:
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
        });

    it(`WHEN existing shortcut content has been selected AND 'Enonic rendering' option has been selected THEN 'Preview' button should be disabled in Item Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing shortcut content:
            await studioUtils.findAndSelectItem(SHORTCUT_NAME);
            // 2. Select 'Enonic rendering' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            // 3. Verify that 'Preview' button is disabled on the Preview Panel(Browse panel):
            await studioUtils.saveScreenshot('engine_preview_button_disabled_for_shortcut');
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
            // 4. Verify that 'Preview not available' message is displayed in the Preview Item panel:
            let actualMessage = await contentItemPreviewPanel.getNoPreviewMessage();
            assert.ok(actualMessage.includes(appConst.PREVIEW_PANEL_MESSAGE.PREVIEW_NOT_AVAILABLE), 'Preview not available - should be displayed');

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
