/**
 * Created on 02.07.2021.
 */
const chai = require('chai');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const SiteForm = require('../../page_objects/wizardpanel/site.form.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');

describe('base.add.site.spec - Open site wizard and save new site', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = 'main region';

    it(`WHEN site wizard is opened and an application and page descriptor have been selected THEN Save button gets disabled`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            let contentWizardPanel = new ContentWizardPanel();
            let siteForm = new SiteForm();
            //1. Open new site-wizard, verify that the wizard is loaded in the browser tab:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizardPanel.typeDisplayName(displayName);
            await siteForm.addApplications([appConst.APP_CONTENT_TYPES]);
            await contentWizardPanel.selectPageDescriptor(CONTROLLER_NAME);
            await contentWizardPanel.waitForSaveButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
