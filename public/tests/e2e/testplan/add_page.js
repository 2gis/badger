var addTestPlanPage = function() {
    this.saveButton = element(by.css('[ng-click="save(testPlan)"]'));
    this.testPlanNameInput = element(by.model('testPlan.name'));
    this.statisticHeader = element(by.id('statistic_header'));
};

module.exports = new addTestPlanPage();
