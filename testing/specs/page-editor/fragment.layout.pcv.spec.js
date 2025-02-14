/**
 * Created on 14.02.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('fragment.layout.pcv.spec - Select a layout in fragment and verify regions', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const LAYOUT_3_COL = '3-col';

    // Verifies https://github.com/enonic/app-contentstudio/issues/8027
    // Layout regions not added when changing layout #8027
    it(`GIVEN the empty layout-component has been saved as fragment WHEN 3-col layout has been selected in LiveView THEN 3 layout-regions should be displayed in PCV`,
        async () => {

            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);

            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new Layout-component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await pageComponentView.openMenu('Layout');
            // 4. Save the empty layout-component as fragment:
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.waitForNotificationMessage();
            // 5. Switch to the new wizard and select the '3-col' layout:
            await studioUtils.doSwitchToNewWizard();
            await pageComponentsWizardStepForm.clickOnComponent("Layout");
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_3_COL);
            // 6. Verify that 3 regions are present in the PCV:
            await pageComponentsWizardStepForm.waitForItemDisplayed('left');
            await pageComponentsWizardStepForm.waitForItemDisplayed('center');
            await pageComponentsWizardStepForm.waitForItemDisplayed('right');
            // 7. Verify that '3-col' layout is displayed in PCV:
            let names = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.equal(names[0], LAYOUT_3_COL, '3-col component should be displayed in PCV');
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
