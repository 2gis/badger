var LoginPage = function() {
    this.userName = element(by.model('username'));
    this.password = element(by.model('password'));
    this.submitButton = element(by.id('gobutton'));
    this.loginButton = element(by.css('[ng-click="login()"]'));
    this.logoutButton = element(by.css('[ng-click="logout()"]'));
};

module.exports = new LoginPage();