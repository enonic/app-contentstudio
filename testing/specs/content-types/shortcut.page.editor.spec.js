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

    // Page Editor shouldn't even be shown for a shortcut (unless there's a page template for the Shortcut content type).
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
            // 3. Verify that 'Preview' button should be enabled in the wizard toolbar:
            await contentWizard.waitForPreviewButtonEnabled();
            // 4. Details option should be selected in the widget selector dropdown:
            let selectedOption = await wizardDetailsPanel.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(selectedOption, 'Details', "'Details' selected option should be in the widget selector");
        });

    // When preview request for a selected content returns 3xx code, show our standard "Preview not unavailable" message instead of showing the redirect target content as now.
    // https://github.com/enonic/app-contentstudio/issues/4294
    it(`WHEN existing shortcut to the site with controller is selected THEN 'Preview not available' is displayed in Preview panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing folder:
            await studioUtils.findAndSelectItem(SHORTCUT_NAME);
            await studioUtils.saveScreenshot('preview_not_available_shortcut');
            // 2. Verify that 'Preview not available' is displayed in Preview panel
            await contentItemPreviewPanel.waitForPreviewNotAvailAbleMessageDisplayed();
            // 3. 'Preview' button should be disabled in the ItemPreviewPanel toolbar:
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
        });

    it(`WHEN existing shortcut content has been selected AND 'Site engine' option has been selected THEN 'Preview' button should be disabled in Item Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing pptx content:
            await studioUtils.findAndSelectItem(SHORTCUT_NAME);
            // 2. Select 'Site engine' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.SITE_ENGINE);
            // 3. Verify that 'Preview' button is disabled
            await studioUtils.saveScreenshot('engine_preview_button_disabled_for_shortcut');
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();

            let actualMessage = await contentItemPreviewPanel.getNoPreviewMessage();
            // 4. 'Can not render non-media content' message should be displayed
            assert.ok(actualMessage.includes(appConst.PREVIEW_PANEL_MESSAGE.CAN_NOT_RENDER_WITH_SITE_ENGINE),
                'expected message should be displayed');

        });

    // Verifies - Page Editor should not display target content for a shortcut #6619
    // https://github.com/enonic/app-contentstudio/issues/6619
    // [Regression] Preview of a shortcut shows target content #4294
    it(`WHEN existing shortcut with the site in target selector is opened THEN 'Show Page Editor' toggler should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open the shortcut with the site in target selector  an existing folder:
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_NAME);
            // 2. Verify that 'Show Page Editor' toggler(monitor-button) should not be displayed:
            await contentWizard.waitForPageEditorTogglerNotDisplayed();
            await studioUtils.saveScreenshot('shortcut_target_site_with_controller_preview_disabled');
            // 3. Verify that 'Live Edit' frame is not displayed
            await contentWizard.waitForLiveEditNotVisible();
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
