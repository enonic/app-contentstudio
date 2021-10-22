const Page = require('./page');
const appConst = require('../libs/app_const');

class LoginPage extends Page {

    get usernameInput() {
        return `//div[contains(@class,'home-main-container')]//input[contains(@id,'username-input')]`
    }

    get passwordInput() {
        return `input[id^='password-input']`
    }

    get loginButton() {
        return `button[id^='login-button']`
    }

    async typeUserName(userName) {
        let usernameInput = await this.findElement(this.usernameInput);
        return await usernameInput.addValue(userName);
    }

    async clickOnLoginButton() {
        await this.clickOnElement(this.loginButton);
        return await this.pause(200);
    }

    waitForPageLoaded() {
        return this.waitForElementDisplayed(this.usernameInput, appConst.mediumTimeout)
    }

    getTitle() {
        return this.browser.getTitle();
    }

    async doLogin(userName, password) {
        let name = userName ? userName : 'su';
        let pass = password ? password : 'password';
        let usernameInput = await this.findElement(this.usernameInput);
        let passwordInput = await this.findElement(this.passwordInput);
        await usernameInput.waitForDisplayed(1000);
        await usernameInput.addValue(name);
        await passwordInput.addValue(pass);
        return await this.clickOnLoginButton();
    }
}

module.exports = LoginPage;
