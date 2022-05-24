/**
 * Created on 24.05.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const SettingsStepForm = require('../page_objects/wizardpanel/settings.wizard.step.form');

describe('filter.by.owner.selector.spec: tests for filtering by', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let USER;
    let FOLDER;
    it(`Precondition 1: new system user should be added`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new system user:
            await studioUtils.navigateToUsersApp();
            let userName = contentBuilder.generateRandomName("user");
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_ADMIN];
            USER = contentBuilder.buildUser(userName, appConst.PASSWORD.MEDIUM, contentBuilder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN just created user added a folder with En language WHEN wizard for new child folder has been opened THEN 'English' language should be present in the wizard by default",
        async () => {
            let settingsForm = new SettingsStepForm();
            //1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, USER.password);
            let displayName = appConst.generateRandomName('folder');
            //2. User adds new folder with English language:
            FOLDER = contentBuilder.buildFolder(displayName, null, appConst.LANGUAGES.EN);
            await studioUtils.doAddFolder(FOLDER);
            //3. Open wizard for new child folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await studioUtils.saveScreenshot("child_folder_default");
            //4. Verify language in the wizard for new child folder:
            let language = await settingsForm.getSelectedLanguage();
            assert.equal(language, appConst.LANGUAGES.EN, "English language should be selected by default in wizard for new child content");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    //TODO uncomment it:
    // beforeEach(() => studioUtils.navigateToContentStudioApp());
    // afterEach(function () {
    //     return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    // });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });

})
;