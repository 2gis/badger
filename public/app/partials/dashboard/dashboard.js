'use strict';

var app = angular.module('testReport.dashboard', [
    'ngRoute',
    'testReportServices',
    'testReportCommon',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard/:projectId/', {
        templateUrl: '/static/app/partials/dashboard/dashboard.html',
        controller: 'DashboardCtrl'
    });
}]);

app.controller('DashboardCtrl', ['$scope', '$rootScope', '$filter', '$routeParams', 'appConfig', 'Project', 'TestPlan', 'Launch', 'Stage', 'HandleTestplans', 'HandleLaunches', 'GroupLaunches', 'CreateTestChart', 'CreateReleaseChart',
    function ($scope, $rootScope, $filter, $routeParams, appConfig, Project, TestPlan, Launch, Stage, HandleTestplans, HandleLaunches, GroupLaunches, CreateTestChart, CreateReleaseChart) {
        $scope.projects = [];
        $rootScope.isMainDashboard = false;
        $scope.chartPercentType = 'failed';

        $rootScope.selectProject($routeParams.projectId);
        Project.get({projectId: $routeParams.projectId}, function (response) {
            $scope.project = response;
            fetchData();
        });

        function fetchData() {
            TestPlan.get({ projectId: $scope.project.id }, function (response) {
                $scope.project.statistics = HandleTestplans(response.results);
                _.each($scope.project.statistics, function (statistic_testplan) {
                    $scope.prepareDataForChart(statistic_testplan, appConfig.DEFAULT_DAYS);
                });
            });
            Stage.get({ projectId: $scope.project.id }, function (response) {
               $scope.project.stages = _.sortBy(response.results, 'weight');
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
                var chartLaunchesByBranch = GroupLaunches(launches, 'branch');

                testplan.charts = {};
                CreateTestChart(testplan, chartLaunches, days);
                CreateReleaseChart(testplan, chartLaunchesByBranch, days);
            });
        };
    }
]);
