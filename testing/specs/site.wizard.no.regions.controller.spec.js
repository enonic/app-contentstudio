/**
 * Created on 27.02.2019.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../libs/app_const');

describe('site.wizard.no.regions.controller.spec: checks Save button after selecting a template with `no region` ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NO_REGIONS = 'no regions';

    // verifies https://github.com/enonic/app-contentstudio/issues/210
    // "Save" button doesn't get disabled after save when assigning a template with no regions to a site
    it(`GIVEN new site wizard is opened AND name has been typed WHEN controller with 'no regions' has been selected THEN Save button gets disabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES]);
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(SITE.displayName);
            await siteFormPanel.addApplications([appConst.TEST_APPS_NAME.APP_CONTENT_TYPES]);
            //site should be automatically saved after selecting the controller
            await contentWizard.selectPageDescriptor(CONTROLLER_NO_REGIONS);
            // Save button gets disabled after selecting 'no regions':
            await contentWizard.waitForSaveButtonDisabled();
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
