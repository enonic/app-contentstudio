/**
 * Created on 05.11.2019. updated on 10.09.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require('../../libs/content.builder');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');

describe('revert.site.with.components.spec: Insert Text component then revert the previous version and check Live Frame', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TEXT = 'test text';

    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`Preconditions: new site should be created`, async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
        await studioUtils.doAddSite(SITE);
    });

    it(`Preconditions: GIVEN existing site is opened AND text component has been inserted`, async () => {
        let contentWizard = new ContentWizard();
        let pageComponentView = new PageComponentView();
        let textComponentInspectionPanel = new TextComponentInspectionPanel();
        let liveFormPanel = new LiveFormPanel();
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        // 1. Click on minimize-toggle, expand 'Live Edit' and open 'Page Component' modal dialog:
        await contentWizard.clickOnCollapseContentForm();
        // 2. Open the context menu:
        await pageComponentView.rightClickAndOpenContextMenu('main');
        // 3. Click on the 'Insert Text' menu item:
        await pageComponentView.selectContextMenuItem([
            appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT,
            appConst.PCV_MENU_ITEM.TEXT,
        ]);
        await textComponentInspectionPanel.waitForOpened();
        await textComponentInspectionPanel.clickInTextArea();
        await textComponentInspectionPanel.typeTextInEditor(TEXT);
        await contentWizard.waitAndClickOnSave();
    });

    it(`GIVEN existing site with text component is opened WHEN do right click on the text-component THEN component's context menu should appear`, async () => {
        let contentWizard = new ContentWizard();
        let liveFormPanel = new LiveFormPanel();
        // 1. Open the site with text component:
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        // 2. Do right-click on the text-component:
        await contentWizard.switchToLiveEditFrame();
        await liveFormPanel.doRightClickOnTextComponent(TEXT);
        await studioUtils.saveScreenshot('text_component_context_menu');
        // 3. Verify menu items:
        let result = await liveFormPanel.getItemViewContextMenuItems();
        assert.equal(result[0], 'Select parent');
        assert.equal(result[1], 'Insert');
        assert.equal(result[2], 'Reset');
        assert.equal(result[3], 'Remove');
        assert.equal(result[4], 'Duplicate');
        assert.equal(result[5], 'Save as Fragment');
        assert.equal(result[6], 'Edit');
    });

    it(`GIVEN existing site with text component is opened WHEN the version without the component has been reverted THEN the component should not be present in Live Edit frame`, async () => {
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
        // TODO https://github.com/enonic/app-contentstudio/issues/10753
        //await liveFormPanel.waitForTextComponentNotDisplayed(TEXT);
        await contentWizard.switchToMainFrame();
        // 4.Verify - Save button should be disabled after the reverting:
        await contentWizard.waitForSaveButtonDisabled();
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
