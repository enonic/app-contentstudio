/**
 * Created on 10.07.2023
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
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');

describe('expanding.pcv.tree.spec - test for expanding PCV tree to the item selected in Live Edit', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const TEXT_COMPONENT_1 = 'text1';
    const TEXT_COMPONENT_2 = 'text2';
    const TEXT_LEFT_REGION = 'left region txt';
    const LAYOUT_3_COL = '3-col';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`WHEN the first text-component has been clicked in 'Live Edit' THEN this component gets selected in PCV`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let textComponentCke = new TextComponentCke();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Insert the first text component:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor(TEXT_COMPONENT_1);
            await contentWizard.switchToMainFrame();
            // 3. Insert the second text component:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor(TEXT_COMPONENT_2);
            await contentWizard.switchToMainFrame();
            await contentWizard.hotKeySave();
            await contentWizard.pause(1200);
            await contentWizard.switchToLiveEditFrame();
            // 4. Select the first component in Live Edit:
            await liveFormPanel.doClickOnTextComponent(TEXT_COMPONENT_1);
            await studioUtils.saveScreenshot('text_components_selected_1');
            await contentWizard.switchToMainFrame();
            // 5. Verify that the first text-component gets selected in PCV
            let isSelected = await pageComponentsWizardStepForm.isComponentSelected(TEXT_COMPONENT_1);
            assert.ok(isSelected, 'The first text component should be selected in PCV');
            await contentWizard.switchToLiveEditFrame();
            // 6. Select the second component in Live Edit
            await liveFormPanel.doClickOnTextComponent(TEXT_COMPONENT_2);
            await studioUtils.saveScreenshot('text_components_selected_2');
            await contentWizard.switchToMainFrame();
            // 7. Verify that the second text-component gets selected in PCV
            isSelected = await pageComponentsWizardStepForm.isComponentSelected(TEXT_COMPONENT_2);
            assert.ok(isSelected, 'The second text component should be selected in PCV')
            isSelected = await pageComponentsWizardStepForm.isComponentSelected(TEXT_COMPONENT_1);
            assert.ok(isSelected === false, 'The first text component is not selected now');
        });

    it(`WHEN 3-col layout with text components has been inserted THEN layout component should be expanded`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert the first text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_3_COL);
            await contentWizard.waitForNotificationMessage();
            // 4. Insert text component in the left layout's region (Verify that layout item is expanded in PCV)
            await pageComponentView.openMenu('left');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor(TEXT_LEFT_REGION);
            await contentWizard.switchToMainFrame();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    // Verify the issue -  Expand Page Components View tree to the item selected in Live Edit #6485
    it(`WHEN the first text-component has been clicked in Live Edit THEN parent items should expand and selected in live edit item to be selected in PCV tree also`,
        async () => {
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            let pageComponentView = new PageComponentView();
            // 1. Open the existing site with text components:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await contentWizard.switchToLiveEditFrame();
            // 3. Select the text in left region in layout component in Live Edit:
            await liveFormPanel.doClickOnTextComponent(TEXT_LEFT_REGION);
            await contentWizard.switchToMainFrame();
            await studioUtils.saveScreenshot('left_region_selected_1');
            // 4. Verify that the layout item is gets expanded in PCV:
            let isSelected = await pageComponentView.isComponentSelected(TEXT_LEFT_REGION);
            assert.ok(isSelected, 'The text in left region should be selected in PCV');
            await pageComponentView.waitForItemDisplayed('left');
            await pageComponentView.waitForItemDisplayed('center');
            await pageComponentView.waitForItemDisplayed('right');
        });

    // Verifies Layout component remains visible after deleting in Page Component View #6475
    // https://github.com/enonic/app-contentstudio/issues/6475
    it(`WHEN expanded layout item has been removed in PCV THEN the layout should not be present in PCV tree items`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open the existing site with text components:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.expandItem(LAYOUT_3_COL);
            // 3. Select the text in left region in layout component in Live Edit:
            await pageComponentView.openMenu(LAYOUT_3_COL);
            await pageComponentView.selectMenuItem(['Remove']);
            await studioUtils.saveScreenshot('layout_removed')
            // 4. Verify that the layout item is gets expanded in PCV:
            let result = await pageComponentView.getPageComponentsDisplayName();
            assert.ok(result.includes('main region'), 'main region item should be displayed in the modal dialog');
            assert.ok(result.includes('Main'), 'main item should be displayed in the modal dialog');
            assert.ok(result.includes('text1'), 'text component should be displayed in the modal dialog');
            assert.ok(result.includes('text2'), 'the second text component should be displayed in the modal dialog');
            assert.equal(result.length, 4, "4 items should be displayed in PCV after deleting the layout item");
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
