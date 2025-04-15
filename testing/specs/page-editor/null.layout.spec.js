/**
 * Created on 15.04.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const appConst = require('../../libs/app_const');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const PartInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/part.inspection.panel');

describe('null.layout.spec - test for layout-controller that returns null ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const LAYOUT_NULL = 'Layout Null';
    const TEST_TEXT = 'test1';
    const PART_NAME = appConst.PART_NAME.CITIES_LIST;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`WHEN null layout has been inserted THEN 'layout is empty' text should be displayed in LiveEdit AND Options filter input should not be displayed in the component`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();

            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert the layout with controller that returns null:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_NULL);
            await contentWizard.waitForNotificationMessage();
            // 4. Verify the text in the Live Edit:
            let text = await liveFormPanel.getTextFromEmptyLayout();
            assert.ok(text[0].includes(`Layout "${LAYOUT_NULL}"`, `'layout is empty' - this text should be displayed in the LiveEdit`));
            let isDisplayed = await liveFormPanel.isOptionsFilterInputInLayoutComponentNotDisplayed(0);
            assert.ok(isDisplayed === false, "Options filter should not be displayed for null-layout");
        });

    // Verify  https://github.com/enonic/app-contentstudio/issues/7676
    // Fragment: inspection panel doesn't trigger update events #7676
    it(`GIVEN a part with text input in its config has been saved as fragment WHEN text has been typed THEN Save button gets enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();

            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Maximize the Live Edit:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a part with config:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Part']);
            await liveFormPanel.selectPartByDisplayName(PART_NAME);
            await contentWizard.switchToMainFrame();
            await pageComponentView.openMenu(PART_NAME);
            // 4. Click on 'Save as Fragment' menu item. (Save the part as fragment)
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(700);
            await studioUtils.doSwitchToNewWizard();
            let partInspectionPanel = new PartInspectionPanel();
            await partInspectionPanel.waitForOpened();
            await studioUtils.saveScreenshot('fragment_inspect_issue_7676_0');
            // 5. Type a text in the config in Inspect Panel
            await partInspectionPanel.typeTexInTextInputConfig(TEST_TEXT);
            await studioUtils.saveScreenshot('fragment_inspect_issue_7676_1');
            // 6. Verify that Save button gets enabled:
            await contentWizard.waitForSaveButtonEnabled();
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('fragment_inspect_issue_7676_3');
            // 7. Verify the saved text:
            let result = await partInspectionPanel.getTextFomTextInputConfig();
            assert.equal(result, TEST_TEXT, 'Expected text should be displayed in the input in Fragment(Part) Inspection Panel')
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
