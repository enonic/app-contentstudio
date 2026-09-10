/**
 * Created on 10.09.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageWidgetPanel = require('../../page_objects/wizardpanel/liveform/page.widget.context.window');
const appConst = require('../../libs/app_const');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');

describe('article.customize.on.create.config.spec: UI test for automatic content customization', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_579992;
    const EXPECTED_CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`WHEN wizard for article whose schema has customizeOnCreate: true is opened THEN 'Customize page' button is not displayed in the Inspect tab but 'Page' step is displayed`, async () => {
        let contentWizard = new ContentWizard();
        // 1. Open wizard for new article whose schema has customizeOnCreate: true
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.ARTICLE_ALLOW_NON_MEDIA);
        let pageInspectTab = new PageInspectionPanel();
        let liveFormPanel = new LiveFormPanel();
        let wizardContextWindow = await contentWizard.openContextWindow();
        await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
        let pageWidgetPanel = new PageWidgetPanel();
        // 2. Click on Inspect tab item:
        await pageWidgetPanel.clickOnTabBarItem(appConst.CONTEXT_WINDOW_TABS.INSPECT);
        // 3. Verify that 'Customize page' button is not displayed
        await pageInspectTab.waitForCustomizePageButtonNotDisplayed();
        // 4. Expected controller is selected in the selector by default
        let actualController = await pageInspectTab.getSelectedPageController();
        assert.equal(
            actualController,
            EXPECTED_CONTROLLER_NAME,
            'Expected controller should be displayed in the selector',
        );
        // 3. Verify that 'Page' item is displayed in the WizardStepNavigator
        await contentWizard.waitForWizardStepDisplayed('Page');
        await contentWizard.switchToLiveEditFrame();
        // 4. Right click and verify menu items in the context menu
        await liveFormPanel.doRightClickOnTextComponent('Customize test');
        await studioUtils.saveScreenshot('text_component_customized_article');
        let result = await liveFormPanel.getItemViewContextMenuItems();
        assert.equal(result[0], 'Select parent');
        assert.equal(result[1], 'Insert');
        assert.equal(result[2], 'Reset');
        assert.equal(result[3], 'Remove');
        assert.equal(result[4], 'Duplicate');
        assert.equal(result[5], 'Save as Fragment');
        assert.equal(result[6], 'Edit');
    });

    it(`WHEN wizard for article whose schema has customizeOnCreate: false is opened THEN 'Customize page' button is not displayed in the Inspect tab but 'Page' step is displayed`, async () => {
        let contentWizard = new ContentWizard();
        // 1. Open wizard for new article:
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.ARTICLE);
        let pageInspectTab = new PageInspectionPanel();
        let wizardContextWindow = await contentWizard.openContextWindow();
        await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
        let pageEditorExtension = new PageWidgetPanel();
        // 2. 'Inspect' tab item should be activated by default:
        await pageEditorExtension.waitForTabActive(appConst.CONTEXT_WINDOW_TABS.INSPECT);
        // 3. Verify that 'Customize page' button is not displayed
        await pageInspectTab.waitForCustomizePageButtonDisplayed();
        let actualController = await pageInspectTab.getSelectedPageController();
        assert.equal(actualController, 'Automatic', 'Automatic controller should be displayed in the selector');
        // 4. Verify that 'Page' item is not displayed in the WizardStepNavigator
        await contentWizard.waitForWizardStepNotDisplayed('Page');
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
