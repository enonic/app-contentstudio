/**
 * Created on 01.03.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');
const appConst = require('../../libs/app_const');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');

describe('Tests for text-component and htmlArea in Inspect Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const TEXT_COMPONENT_TEXT = appConst.generateRandomName('text');

    it(`Preconditions: new site and should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });


    it(`GIVEN new text component has been inserted WHEN a text has been inserted in htmlArea in Inspect Panel THEN this text appears in LiveView`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site and insert new text component with the text:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Text']);
            // 4. Insert a text in htmlArea in Inspect Panel:
            await textComponentInspectionPanel.typeTextInEditor(TEXT_COMPONENT_TEXT);
            // 5. Verify that Apply button gets enabled in Inspect Panel:
            await textComponentInspectionPanel.waitForApplyButtonEnabled();
            // 6. Save the text component:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(500);
            // 7. Verify that the text appears in LiveView:
            await contentWizard.switchToLiveEditFrame();
            let actualResult = await liveFormPanel.getTextFromTextComponents();
            assert.ok(actualResult.includes(TEXT_COMPONENT_TEXT), 'expected text should be present in the text component in LiveView');
        });

    it(`GIVEN existing site with text-component is opened WHEN text-component has been clicked in PCV THEN expected text should be displayed in htmlArea in Inspect Panel`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            // 1. Open existing site and insert new text component with the text:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the text component in PCV:
            await pageComponentView.clickOnComponent(TEXT_COMPONENT_TEXT);
            // 4. Verify that the text is displayed in htmlArea in Inspect Panel:
            let actualText = await textComponentInspectionPanel.getTextFromEditor();
            assert.ok(actualText.includes(TEXT_COMPONENT_TEXT), 'expected text should be present in the text component in Inspect tab');
            // 5. Verify that Apply button is disabled in Inspect Panel:
            await textComponentInspectionPanel.waitForApplyButtonDisabled();
        });

    // Verify - Content won't get saved when pressing CTRL-S in the Text Inspection panel #8781
    // https://github.com/enonic/app-contentstudio/issues/8781
    it(`GIVEN a text has been inserted in htmlArea in Inspect Panel WHEN CTRL(command)+S has been pressed THEN this text appears in LiveView`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site and insert new text component with the text:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Text']);
            // 4. Insert a text in htmlArea in Inspect Panel:
            await textComponentInspectionPanel.typeTextInEditor(TEXT_COMPONENT_TEXT);
            // 6. Press CTRL(Command) + S :
            await contentWizard.hotKeySave();
            await studioUtils.saveScreenshot('issue_save_text_inspect_panel');
            await contentWizard.waitForNotificationMessage();
            // 7. Verify that the text appears in LiveView:
            await contentWizard.switchToLiveEditFrame();
            let actualResult = await liveFormPanel.getTextFromTextComponents();
            assert.ok(actualResult.includes(TEXT_COMPONENT_TEXT), 'expected text should be present in the text component in LiveView');
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
