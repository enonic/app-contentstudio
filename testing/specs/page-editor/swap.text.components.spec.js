/**
 * Created on 23.08.2018. updated on 16.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const TextComponentInspectionPanel = require("../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel");

describe('Swap two Text Component - specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;


    it(`GIVEN two Text components have been inserted in the 'main' region WHEN the components have been swapped in Page Components View THEN the components should be displayed in the reversed order`,
        async () => {

            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, null, [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);

            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnWizardStep('Page');
            // 2. Insert the first text component:
            await pageComponentsWizardStepForm.rightClickAndOpenContextMenu('main');
            await pageComponentsWizardStepForm.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentInspectionPanel.waitForOpened();
            await textComponentInspectionPanel.typeTextInEditor('component1');
            // 3. Insert the second text component:
            await pageComponentsWizardStepForm.rightClickAndOpenContextMenu('main');
            await pageComponentsWizardStepForm.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentInspectionPanel.typeTextInEditor('component2');
            //await contentWizard.hotKeySave();
            //await contentWizard.pause(1200);
            // 4. Swap components:
            await studioUtils.saveScreenshot('text_components_swapped1');
            await pageComponentsWizardStepForm.swapComponents('component1', 'component2');
            await studioUtils.saveScreenshot('text_components_swapped2');
            // 5. Verify that the components are displayed in the reversed order:
            let result = await pageComponentsWizardStepForm.getTextComponentsDisplayName();
            assert.equal(result[0], 'component2', 'First component should be "component2"');
            assert.equal(result[1], 'component1', 'Second component should be "component1"');
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
