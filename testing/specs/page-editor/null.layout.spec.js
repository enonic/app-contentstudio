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

describe('null.layout.spec - test for layout-controller that returns null ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const LAYOUT_NULL = 'Layout Null';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.FIRST_SELENIUM_APP], CONTROLLER_NAME);
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

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
