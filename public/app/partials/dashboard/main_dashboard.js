'use strict';

var app = angular.module('testReport.mainDashboard', [
    'ngRoute',
    'testReportServices',
    'testReportCommon',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard', {
        templateUrl: '/static/app/partials/dashboard/main_dashboard.html',
        controller: 'MainDashboardCtrl'
    });
}]);

app.controller('MainDashboardCtrl', ['$scope', '$rootScope', 'appConfig', 'Project', 'TestPlan', 'Launch', 'HandleTestplans', 'HandleLaunches', 'GroupLaunches', 'CreateTestChart',
    function ($scope, $rootScope, appConfig, Project, TestPlan, Launch, HandleTestplans, HandleLaunches, GroupLaunches, CreateTestChart) {
        $scope.default_days = appConfig.DEFAULT_DAYS;

        Project.query(function (response) {
            $scope.projects = response.results;
            fetchData();
        });

        function fetchData() {
            _.each($scope.projects, function (project) {
                TestPlan.get({ projectId: project.id }, function (response) {
                    project.statistics = HandleTestplans(response.results);
                    _.each(project.statistics, function (statistic_testplan) {
                        $scope.prepareDataForChart(statistic_testplan, appConfig.DEFAULT_DAYS);
                    });
                });
            });
        }

        $scope.prepareDataForChart = function(testplan, days) {
            testplan.days = days;
            Launch.custom_list({
                testPlanId: testplan.id,
                state: appConfig.LAUNCH_STATE_FINISHED,
                days: days,
                search: testplan.filter
            }, function (response) {
                var launches = HandleLaunches(testplan, response.results);
                var chartLaunches = GroupLaunches(launches, 'groupDate');

                testplan.charts = {};
                CreateTestChart(testplan, chartLaunches, days);
            });
        };
    }
]);
