/**
 * Created on 01.02.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const PageInspectionPanel = require('../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ContextWindow = require('../page_objects/wizardpanel/liveform/liveform.context.window');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const PageComponentView = require("../page_objects/wizardpanel/liveform/page.components.view");
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');
const appConst = require('../libs/app_const');

describe('site.controller.preview.spec: checks Preview button and options in selector for Page Templates and Controllers', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'Page';
    const FOOTER_TEXT = 'Configure footer text.'

    it(`GIVEN wizard for new site is opened WHEN page controller is not selected THEN 'Preview' button should not be visible in the wizard toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test preview site', [appConst.APP_CONTENT_TYPES]);
            // 1. Open new site-wizard:
            await studioUtils.doOpenSiteWizard();
            // 2. Controller is not selected in the wizard
            await contentWizard.typeData(SITE);
            // 3. Verify that 'Preview' button is not displayed:
            await contentWizard.waitForPreviewButtonNotDisplayed();
        });

    it(`WHEN existing site has been selected(application is not added in the site-wizard) THEN 'Preview' button should be disabled in ItemPreviewPanel toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the site
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 3. Verify that 'Preview' button is disabled in the browse toolbar: (No template or page configured)
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
            // 4. Verify that 'Failed to render content preview' is displayed in Content Item Preview panel:
            await studioUtils.saveScreenshot('site_preview_not_available');
            let text = await contentItemPreviewPanel.getNoPreviewMessage();
            assert.ok(text.includes(appConst.PREVIEW_PANEL_MESSAGE.PREVIEW_NOT_AVAILABLE),
                "Expected text should be displayed in Content Item Preview panel");
            let actualOption = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
        });

    it(`GIVEN existing site is opened WHEN page controller has been selected THEN required options should be present in Inspection Panel`,
        async () => {
            let contentWizard = new ContentWizard();
            let contextWindow = new ContextWindow();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            await contentWizard.waitForPreviewButtonNotDisplayed();

            // 2. Select a controller:
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            await contentWizard.pause(700);
            // 3. Verify that Preview button gets visible in the wizard-toolbar
            await contentWizard.waitForPreviewButtonDisplayed();
            // 4. Context Window loads automatically, click on 'Page' tab:
            await contextWindow.clickOnTabBarItem('Page');
            // 5. Click on dropdown handle and expand options:
            let actualOptions = await pageInspectionPanel.getOptionsDescriptionInPageTemplateDropdown();
            // 6. Verify actual options:
            await studioUtils.saveScreenshot('site_inspect_panel_template_dropdown');
            let expectedOption = `( no default template found )`;
            assert.equal(actualOptions[0], expectedOption, 'name of automatic template should be displayed');
            assert.equal(actualOptions[1], 'test region', 'expected option should be present');
            assert.equal(actualOptions[2], 'home page', 'expected option should be present');
        });

    it(`WHEN existing site(controller is selected) has been clicked THEN 'Preview' button should be enabled in the ItemPreviewPanel toolbar and in Context menu`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the site(controller is selected)
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 3. Verify that 'Preview' button is enabled in the ItemPreviewPanel toolbar:
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            // 4.Verify that Preview menu item is not displayed in grid context menu:
            await contentBrowsePanel.rightClickOnItemByDisplayName(SITE.displayName);
            await studioUtils.saveScreenshot('check-context-menu-preview');
            await contentBrowsePanel.waitForContextMenuItemNotDisplayed('Preview');
        });

    // Verifies - Preview Panel is not refreshed after updating contents's page #8239
    // https://github.com/enonic/app-contentstudio/issues/8239
    it(`GIVEN existing site is opened WHEN selected controller has been reset THEN 'Preview' button gets not visible in wizard-toolbar and gets disabled in ItemPreviewPanel-toolbar `,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Expand the menu:
            await pageComponentView.openMenu(CONTROLLER_NAME);
            // 3. Click on the 'Reset' menu item:
            await pageComponentView.selectMenuItem(['Reset']);
            // 4. Verify that 'Preview' button gets not visible in the wizard toolbar:
            await contentWizard.waitForPreviewButtonNotDisplayed();
            // 5. Verify that Controller Options Filter input gets visible:
            await contentWizard.waitForControllerOptionFilterInputVisible();
            // 6. Verify that 'Preview' button is disabled in browse-toolbar:
            await studioUtils.doSwitchToContentBrowsePanel();
            // 7. Verify that 'Preview' button is disabled in ItemPreviewPanel-toolbar:
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
        });

    // Verifies - Preview Panel is not refreshed after updating contents's page #8239
    // https://github.com/enonic/app-contentstudio/issues/8239
    it(`GIVEN existing site is opened WHEN a page descriptor has been selected in the wizard page THEN 'Preview' button gets enabled in ItemPreviewPanel-toolbar AND expected text appears in LiveView`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            // 1. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Select a controller:
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            await contentWizard.pause(700);
            // 6. go to Browse Panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            // 7. Verify that 'Preview' button is enabled in ItemPreviewPanel-toolbar:
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            // 8.Verify that text from the descriptor page is displayed in the LIVE VIEW in Browse Panel:
            await contentItemPreviewPanel.switchToTextFrame();
            let locator = "//div[@class='site-info']";
            await studioUtils.waitForElementDisplayed(locator, appConst.mediumTimeout);
            // 9. Verify that text from the descriptor page is displayed in the LIVE VIEW in Browse Panel:
            let footerText = await studioUtils.getText(locator);
            assert.equal(footerText, FOOTER_TEXT, 'Footer text should be displayed in the preview panel');

        });

    // test to verify of XP-4123 (Page Editor inaccessible for a folder)
    it(`GIVEN existing site is selected WHEN child folder has been saved THEN 'Show Page Editor' button should be present in the wizard toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Select the site, then open new wizard for folder:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Verify that Page Editor toggler is displayed:
            await contentWizard.waitForPageEditorTogglerDisplayed();
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
