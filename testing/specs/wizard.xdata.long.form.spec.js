/**
 * Created on 18.03.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const XDataHtmlArea = require('../page_objects/wizardpanel/xdata.htmlarea.wizard.step.form');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe("wizard.xdata.long.form.spec:  Wizard's navigation toolbar (long forms)", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let contentName = contentBuilder.generateRandomName('content');
    let X_DATA_STEP_WIZARD = 'Html Area x-data';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //verifies https://github.com/enonic/lib-admin-ui/issues/909
    //Wizard's navigation toolbar scrolls to incorrect step on long forms
    it(`WHEN content with long forms (x-data) is opened AND last step has been clicked THEN required form gets visible`,
        () => {
            let xDataHtmlArea = new XDataHtmlArea();
            let contentWizard = new ContentWizard();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double0_1').then(() => {
                return contentWizard.typeDisplayName(contentName);
            }).then(() => {
                //do enable the first form
                return contentWizard.clickOnXdataTogglerByName("Text Area x-data");
            }).then(() => {
                //do enable the second form
                return contentWizard.clickOnXdataTogglerByName("X-data (image selector)");
            }).then(result => {
                //do enable the third form
                return contentWizard.clickOnXdataTogglerByName("Html Area x-data");
            }).then(() => {
                //save the content with long forms
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                // close the wizard
                return studioUtils.doCloseWizardAndSwitchToGrid();
            }).then(() => {
                // reopen the content
                return studioUtils.selectContentAndOpenWizard(contentName);
            }).then(() => {
                //click on the last Wizard-Step
                return contentWizard.clickOnWizardStep(X_DATA_STEP_WIZARD);
            }).then(() => {
                //html-area should be visible
                return xDataHtmlArea.waitForHtmlAreaVisible();
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
