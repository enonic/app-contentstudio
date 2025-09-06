/**
 * Created on 23.08.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('Swap two Text Component - specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site is opened WHEN Page Component View has been opened THEN expected component's description should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            let description = await pageComponentView.getComponentDescription('main region');
            assert.equal(description, 'test region', "Expected description should be displayed");
        });

    it.skip(`GIVEN 2 Text component are inserted  WHEN components have been swapped THEN 2 strings should be displayed in correct order`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let textComponentCke = new TextComponentCke();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            //await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert the first text component:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.typeTextInCkeEditor('component1');
            await contentWizard.switchToMainFrame();
            // 4. Insert the second text component:
            await pageComponentsWizardStepForm.openMenu("main");
            await pageComponentsWizardStepForm.selectMenuItem(["Insert", "Text"]);
            await textComponentCke.typeTextInCkeEditor("component2");
            await contentWizard.switchToMainFrame();
            await contentWizard.hotKeySave();
            await contentWizard.pause(1200);
            // 5. Swap components:
            await studioUtils.saveScreenshot('text_components_swapped1');
            await pageComponentsWizardStepForm.swapComponents("component1", "component2");
            await studioUtils.saveScreenshot('text_components_swapped2');
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
