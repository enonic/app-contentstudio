/**
 * Created on 29.03.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DateTimeForm = require('../../page_objects/wizardpanel/datetime.form.panel');

describe('datetime.config.spec: tests for datetime content ', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN 'now' value is configured in 'dateTime 2:4' WHEN wizard for new 'dateTime 2:4' is opened THEN both inputs with current DateTime should be displayed in the wizard",
        async () => {
            let dateTimeForm = new DateTimeForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'datetime now');
            let values = await dateTimeForm.getDateTimes();
            studioUtils.saveScreenshot('cke_insert_image_dialog1');
            let expectedDate = new Date().toISOString().substring(0, 10);
            assert.isTrue(values.length === 2, "Two dateTime values should be present in the wizard page");
            assert.equal(values[0], values[1], "Both values must be the same");
            assert.isTrue(values[0].includes(expectedDate), "Expected date time should be displayed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
