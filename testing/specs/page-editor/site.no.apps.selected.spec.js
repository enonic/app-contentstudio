/**
 * Created on 15.03.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');

describe('site.with.several.templates: click on dropdown handle in Inspection Panel and change a template ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE_NAME = contentBuilder.generateRandomName('site');

    // Verify Don't auto-show preview panel for a site #6040
    // don't auto-expand the preview panel (the "Monitor" icon should also be "off" by default), if there's no preview or no apps are selected or none
    // of the selected apps provide controllers (basically, if no controller can be selected in the preview panel).
    it("Given wizard for new site has been opened WHEN there's no preview or no apps are selected THEN",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. New site-wizard is opened:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            // 2. Fill in the name input and save it
            await contentWizard.typeDisplayName(SITE_NAME);
            // there's no apps are selected:
            await contentWizard.waitAndClickOnSave();
            // 3. Verify that "Monitor" icon is "off" and live form panel is not displayed:
            await contentWizard.waitForControllerOptionFilterInputNotVisible();
            // 4. Click on Page Editor toggler (monitor icon)
            await contentWizard.clickOnPageEditorToggler();
            // 5. Verify the note in  Live Form panel
            let message = await contentWizard.getMessageInLiveFormPanel();
            assert.equal(message, 'No page controllers found', 'Expected message should be displayed in the live form panel');
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
