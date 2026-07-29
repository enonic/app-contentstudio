/**
 * Created on 14.02.2025  updated on 26.07.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const appConst = require('../../libs/app_const');
const LayoutInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');


describe('fragment.layout.pcv.spec - Select a layout in fragment and verify regions', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`WHEN context menu has been opened for the empty layout THEN Save as Fragment should not be displayed`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, null, [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);

            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 3. Insert new Layout-component:
            await pageComponentView.rightClickAndOpenContextMenu('main');
            await pageComponentView.selectContextMenuItem(['Insert', 'Layout']);
            await pageComponentView.rightClickAndOpenContextMenu('Layout');
            // 4. Save as fragment menu item should not be displayed in the context menu for the empty component:
            await pageComponentView.waitForMenuItemNotDisplayed(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
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
