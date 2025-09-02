/**
 * Created on 15.03.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');

describe('site.no.apps.selected: save a site without applications', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const SITE_NAME = contentBuilder.generateRandomName('site');

    it(`Given wizard for new site has been opened WHEN there's no preview or no apps are selected THEN expected message should be shown in Live View`,
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
            let actualOption = await contentWizard.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
            let actualSize = await contentWizard.getSelectedOptionInEmulatorDropdown()
            assert.equal(actualSize, appConst.EMULATOR_RESOLUTION_VALUE.FULL_SIZE,
                '100% should be selected in emulator dropdown by default');
            // TODO  uncomment the check for Preview button
            // 3. Verify that 'Preview' button should be disabled in the wizard PreviewItem toolbar:
            //await contentWizard.waitForPreviewButtonDisabled();
            // 5. Verify the note in 'Live View' panel
            let message = await contentWizard.getNoPreviewMessage();
            let expectedMessage = 'Please add an application to your site to enable rendering of this item';
            assert.equal(message, expectedMessage, 'Expected message should be displayed in the live view panel');
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
