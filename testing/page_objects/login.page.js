var page = require('./page')

var loginPage = Object.create(page, {
    /**
     * define elements
     */
    usernameInput: {
        get: function () {
            return `input[id^='username-input']`
        }
    },
    passwordInput: {
        get: function () {
            return `input[id^='password-input']`
        }
    },
    loginButton: {
        get: function () {
            return `button[id^='login-button']`
        }
    },

    typeUserName: {
        value: function (userName) {
            return this.typeTextInInput(this.usernameInput, userName);
        }
    },
    typePassword: {
        value: function (password) {
            return this.typeTextInInput(this.passwordInput, password);
        }
    },

    isLoginButtonVisible: {
        value: function () {
            this.isVisible(this.loginButton);
        }
    },

    isUserNameInputVisible: {
        value: function (ms) {
            return this.waitForExist(this.usernameInput, ms);
        }
    },

    isPasswordInputVisible: {
        value: function (ms) {
            return this.waitForExist(this.passwordInput, ms);
        }
    },

    waitForLoginButtonVisible: {
        value: function (ms) {
            return this.waitForVisible(this.loginButton, ms);
        }
    },

    clickOnLoginButton: {
        value: function () {
            return this.doClick(this.loginButton);
        }
    },

    doLogin: {
        value: function () {
            return this.typeTextInInput(this.usernameInput, 'su')
                .then(() => this.typeTextInInput(loginPage.passwordInput, 'password'))
                .then(() => this.waitForLoginButtonVisible(1000))
                .then(() => this.doClick(loginPage.loginButton)).catch(err=> {
                    throw new Error('Error when try to login  ' + err);
                })
        }
    },
});
module.exports = loginPage;



