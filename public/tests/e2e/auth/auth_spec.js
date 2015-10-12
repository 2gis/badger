describe('Login', function () {
    var loginPage = require('./auth_page.js');

    var mockModule;

    beforeEach(function () {
        mockModule = require('./auth_mock.js');
        browser.addMockModule('authMock', mockModule.authMock);
        browser.get('/#/dashboard');
    });

    afterEach(function () {
        browser.removeMockModule('authMock');
    });

    //it('should navigate to the login page when the login button is clicked', function () {
    //    loginPage.loginButton.click();
    //    expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/auth/login/');
    //});
    //
    //it('should fail authentication on incorrect login/password', function () {
    //    loginPage.loginButton.click();
    //    loginPage.userName.sendKeys('user');
    //    loginPage.password.sendKeys('user');
    //    loginPage.submitButton.click();
    //    expect(element(by.binding('error')).getText()).toBe('Authentication failed');
    //});
    //
    //it('should fail authentication on empty login/password', function () {
    //    loginPage.loginButton.click();
    //    loginPage.submitButton.click();
    //    expect(element(by.binding('error')).getText()).toBe('Authentication failed');
    //});

    //it('should allow a user to log in', function () {
    //    browser.get('/#/auth/login/');
    //    loginPage.userName.sendKeys('test_user');
    //    loginPage.password.sendKeys('test_user');
    //    loginPage.submitButton.click();
    //    expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/dashboard');
    //    expect(browser.isElementPresent(by.id('test_user'))).toBe(true);
    //});

    var fs = require('fs');
    it('should output the coverage object.', function() {
        browser.driver.executeScript("return __coverage__;").then(function(val) {
          fs.writeFileSync("coverage/e2e/coverageE2E.json", JSON.stringify(val));
        });
    });

    it('test', function () {
        browser.get('/#/auth/login/');
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/auth/login/');
    });

    //it('should allow to logout', function() {
    //    browser.get('/#/auth/login/');
    //    loginPage.userName.sendKeys('test_user');
    //    loginPage.password.sendKeys('test_user');
    //    loginPage.submitButton.click();
    //    loginPage.logoutButton.click();
    //    expect(browser.isElementPresent(loginPage.loginButton)).toBe(true);
    //});
});