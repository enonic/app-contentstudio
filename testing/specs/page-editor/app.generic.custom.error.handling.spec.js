/**
 * Created on 05.02.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('Custom error handling - specification. Verify that application error page is loaded when error occurred', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_WITH_ERROR = 'Page with error';
    const ERROR_MESSAGE_LIVE_EDIT = 'Failed to render content preview.';

    it(`WHEN a controller with error has been selected THEN 'Preview' button should not be displayed in the wizard toolbar AND disabled in Preview panel`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_WITH_ERROR);
            // 1. Open new wizard for a site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            await contentWizard.pause(1000);
            // 2. Select a controller with error:
            let pageInspectionPanel = new PageInspectionPanel();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(CONTROLLER_WITH_ERROR);
            await contentWizard.pause(500);
            await studioUtils.saveScreenshot('site_controller_with_errors');
            // 3. Verify that 'Preview' button is disabled in the Preview wizard-toolbar:
            await contentWizard.waitForPreviewButtonDisabled();
            // 4. 'Hide Page Editor' button should be visible
            await contentWizard.waitForHidePageEditorTogglerButtonDisplayed();
            await contentWizard.waitForMinimizeLiveEditTogglerDisplayed()
            // 5. Verify that 'Failed to render content preview' message appears in the wizard page:
            let messages = await contentWizard.getNoPreviewMessage();
            assert.ok(messages.includes(ERROR_MESSAGE_LIVE_EDIT), 'Expected message should be displayed in the LivView');
            assert.ok(messages.includes('Please check logs for errors'), "Expected message should be displayed in the LivView");
            await studioUtils.doCloseCurrentBrowserTab();
            await studioUtils.doSwitchToContentBrowsePanel();
            // 6. Verify that 'Preview' button is disabled in the browse panel toolbar:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.pause(1000);
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
        });

    it(`GIVEN existing site(controller has errors) has been opened WHEN 'Enonic rendering' has been selected in Wizard LivView THEN expected error message should be displayed in the Preview Panel`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Select the site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Select 'Enonic rendering' in the Preview Dropdown:
            await contentWizard.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            // 3. Verify the error message in the LiveView:
            await contentWizard.switchToLiveEditFrame()
            let actualResult = await contentWizard.get500ErrorText();
            assert.equal(actualResult[0], '500 - Internal Server Error', "Expected message should be displayed in the Wizard LiveView");
            // 4. Verify the Preview button is enabled in the wizard toolbar:
            await contentWizard.switchToParentFrame();
            await contentWizard.waitForPreviewButtonEnabled();
        });

    it(`GIVEN existing site(controller has errors) has been selected WHEN 'Enonic rendering' has been selected in Preview Dropdown THEN expected error message should be displayed in the Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 2. Select 'Enonic rendering' in the Preview Dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            // 3. Verify the error message in the Preview Panel:
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let actualResult = await contentItemPreviewPanel.get500ErrorText();
            assert.equal(actualResult[0], 'Oops, something went wrong!', "Expected message should be displayed in the Preview Panel");
            // 4. Verify the Preview button is enabled in Preview Panel:
            await contentItemPreviewPanel.switchToParentFrame();
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
        });

    it(`GIVEN existing site(controller has a error) WHEN the site has been opened in draft THEN expected error page should be loaded in the browser page`,
        async () => {
            // 1. get the URL: http://localhost:8080/admin/site/preview/default/draft/site554821
            await studioUtils.openResourceInDraft(SITE.displayName);
            // 2. Verify the page source:
            let pageSource = await studioUtils.getPageSource();
            await studioUtils.saveScreenshot('custom_error_handling');
            assert.ok(pageSource.includes('Oops, something went wrong!'), "Expected message should be in the error page!");
            assert.ok(pageSource.includes('System got an error 500'), "Expected response code should be displayed");
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
