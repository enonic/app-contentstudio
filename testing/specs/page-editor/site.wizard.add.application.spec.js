/**
 * Created on 07.11.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const SiteForm = require('../../page_objects/wizardpanel/site.form.panel');

describe('site.wizard.add.application.spec: Select an application in the wizard and check the controller-selector', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    //verifies  https://github.com/enonic/app-contentstudio/issues/1151 (controller selector does not appear after selecting an application in the saved site)
    it(`GIVEN new wizard is opened and site's name is saved WHEN an application has been selected in the wizard THEN controller selector should appear in the Page Editor`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            let contentWizard = new ContentWizard();
            let siteForm = new SiteForm();
            //1. Open new site-wizard:
            await studioUtils.openContentWizard(appConstant.contentTypes.SITE);
            await contentWizard.typeDisplayName(displayName);
            //2. Save the name:
            await contentWizard.waitAndClickOnSave();
            let message = await contentWizard.waitForNotificationMessage();
            //3. Add the application:
            await siteForm.addApplications([appConstant.SIMPLE_SITE_APP]);
            //4. Controller-selector should appear in the Page Editor:
            let result = await contentWizard.waitForControllerOptionFilterInputVisible();
            assert.isTrue(result, "Controller Selector dropdown should appear in the page");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
