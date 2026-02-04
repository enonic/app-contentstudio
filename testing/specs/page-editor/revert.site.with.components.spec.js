/**
 * Created on 05.11.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const TextComponentCke = require('../../page_objects/components/text.component');
const appConst = require('../../libs/app_const');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');
const PageWidgetContextWindowPanel = require('../../page_objects/wizardpanel/liveform/page.widget.context.window');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe("revert.site.with.components.spec: Insert Text component then revert the previous version and check Live Frame", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TEXT = 'test text';

    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`Preconditions: GIVEN existing site is opened AND text component has been inserted`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let liveFormPanel = new LiveFormPanel();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggle, expand 'Live Edit' and open 'Page Component' modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Open the context menu:
            await pageComponentView.openMenu('main');
            // 3. Click on the 'Insert Text' menu item:
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentCke.typeTextInCkeEditor(TEXT);
            await contentWizard.waitAndClickOnSave();
            await textComponentCke.switchToLiveEditFrame();
            // Verify that text component in 'edit' mode is present:
            await liveFormPanel.waitForEditableTextComponentDisplayed(TEXT);
            // 'close' edit  mode button should be displayed:
            await liveFormPanel.waitForCloseEditModeButtonDisplayed();
            // Click on 'close edit mode' button:
            await liveFormPanel.clickOnCloseEditModeButton();
            // Verify that the close-icon  gets not visible:
            await liveFormPanel.waitForCloseEditModeButtonNotDisplayed();
        });

    // Inspect panel changes when switching between preview modes #9449
    // https://github.com/enonic/app-contentstudio/issues/9449
    it(`GIVEN text component has been clicked in PCV WHEN JSON option has been selected in Preview Mode dropdown THEN the text component remains selected in Inspect Tab in Context Window`,
        async () => {
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let pageWidgetContextWindowPanel = new PageWidgetContextWindowPanel();
            // 1. Open the site with text component:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on the component:
            await pageComponentsWizardStepForm.clickOnComponentByDisplayName(TEXT);
            // 3. Verify that text-component inspection panel is loaded:
            await textComponentInspectionPanel.waitForOpened();
            // 4. Select 'JSON' in Preview Mode dropdown:
            await contentWizard.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.JSON);
            // 5. Verify that 'Inspect' tab is active in Context Window:
            let result  = await pageWidgetContextWindowPanel.isTabBarItemActive('Inspect');
            assert.ok(result, "'Inspect' tab should be active in the Context Window");
            await studioUtils.saveScreenshot('text_component_issue_9449');
            // 6. Verify that text-component inspection panel remains displayed :
            await textComponentInspectionPanel.waitForOpened();
            // Error after trying to DnD items from Insert Tab when Json #9451
            // 7. Verify that 'Insert' tab is not displayed in Context Window when JSON option is selected:
            await pageWidgetContextWindowPanel.waitForTabBarItemNotDisplayed('Insert')
        });

    it(`GIVEN existing site with text component is opened WHEN do right click on the text-component THEN component's context menu should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the site with text component:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let position = await contentWizard.getLiveFramePosition();
            // 2. Do right-click on the text-component:
            await contentWizard.switchToLiveEditFrame();
            await liveFormPanel.doRightClickOnTextComponent(TEXT, position.x, position.y);
            await studioUtils.saveScreenshot('text_component_context_menu');
            // 3. Verify menu items:
            let result = await liveFormPanel.getItemViewContextMenuItems();
            assert.equal(result[0], 'Select parent');
            assert.equal(result[1], 'Insert');
            assert.equal(result[2], "Reset");
            assert.equal(result[3], 'Remove');
            assert.equal(result[4], 'Duplicate');
            assert.equal(result[5], 'Save as Fragment');
            assert.equal(result[6], 'Edit');
        });

    //Verifies https://github.com/enonic/xp/issues/7603  (Page changes are not reverted on version revert )
    it(`GIVEN existing site with text component is opened WHEN the version without the component has been reverted THEN the component should not be present in Live Edit frame`,
        async () => {
            let contentWizard = new ContentWizard();
            let versionPanel = new WizardVersionsWidget();
            let liveFormPanel = new LiveFormPanel();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Open  'Versions Panel':
            await contentWizard.openVersionsHistoryPanel();
            // 2. Revert the previous version: click on the second item on the top (the first one is the current version)
            await versionPanel.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            await versionPanel.clickOnRestoreButton();
            await studioUtils.saveScreenshot('site_reverted1');
            await contentWizard.switchToLiveEditFrame();
            // 3. After reverting - text-component should not be present in Live Frame
            await liveFormPanel.waitForTextComponentNotDisplayed(TEXT);
            await contentWizard.switchToMainFrame();
            // 4.Verify - Save button should be disabled after the reverting:
            await contentWizard.waitForSaveButtonDisabled();
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
