'use strict';

var app = angular.module('testReport.dashboard', [
    'ngRoute',
    'testReportServices',
    'testReportServicesDashboard',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard/:projectId/', {
        templateUrl: '/static/app/partials/dashboard/dashboard.html',
        controller: 'DashboardCtrl'
    });
}]);

app.controller('DashboardCtrl', ['$scope', '$rootScope', '$routeParams', 'appConfig', 'TestPlan', 'Launch', 'Stage', 'Filters', 'LaunchHelpers', 'LaunchFilters', 'GetChartsData', 'SeriesStructure', 'Tooltips', 'GetChartStructure',
    function ($scope, $rootScope, $routeParams, appConfig, TestPlan, Launch, Stage, Filters, LaunchHelpers, LaunchFilters, GetChartsData, SeriesStructure, Tooltips, GetChartStructure) {
        $rootScope.selectProject($routeParams.projectId);

        TestPlan.get({ projectId: $routeParams.projectId }, function (response) {
            $scope.testplans = _.filter(response.results, Filters.isMain);
            $scope.testplans = _.filter($scope.testplans, Filters.removeHidden);
            $scope.testplans = _.sortBy($scope.testplans, 'name');



            _.each($scope.testplans, function (testplan) {
                $scope.addChartsToTestplan(testplan, appConfig.DEFAULT_DAYS);
            });
        });

        Stage.get({ projectId: $routeParams.projectId }, function (response) {
           $scope.stages = _.sortBy(response.results, 'weight');
        });

        $scope.addChartsToTestplan = function(testplan, days) {
            testplan.days = days;
            Launch.custom_list({
                testPlanId: testplan.id,
                state: appConfig.LAUNCH_STATE_FINISHED,
                days: days,
                search: testplan.filter
            }, function (response) {
                testplan.charts = [];

                //launches for common chart by date
                var launches = LaunchHelpers.cutDate(response.results);
                launches = LaunchFilters.byDate(launches);
                launches = _.filter(launches, LaunchFilters.isEmptyResults);
                launches = LaunchHelpers.addStatisticData(launches);
                launches = _.sortBy(launches, 'id');

                var seriesData = GetChartsData.series(launches);
                var labels = GetChartsData.labels(launches);

                testplan.charts.push(
                    GetChartStructure(
                        'column',
                        labels,
                        SeriesStructure.getFailedAndSkipped(seriesData.percents.failed, seriesData.percents.skipped)
                    ));

                testplan.charts.push(
                    GetChartStructure(
                        'column',
                        labels,
                        SeriesStructure.getTotal(seriesData.percents.total),
                        Tooltips.total()
                    ));

                testplan.charts.push(
                    GetChartStructure(
                        'area_percent',
                        labels,
                        SeriesStructure.getPercent(seriesData.percents.failed, seriesData.percents.skipped, seriesData.percents.passed),
                        Tooltips.areaPercent()
                    ));

                testplan.charts.push(
                    GetChartStructure(
                        'area_absolute',
                        labels,
                        SeriesStructure.getAbsolute(seriesData.absolute.failed, seriesData.absolute.skipped, seriesData.absolute.passed),
                        Tooltips.areaAbsolute()
                    ));

                if (testplan.variable_name === '') {
                    return;
                }

                //launches for chart by environment variable
                launches = LaunchHelpers.addEnvVariable(launches, testplan.variable_name);
                launches = LaunchFilters.byRegExp(launches, testplan.variable_value_regexp);
                launches = LaunchFilters.byEnvVar(launches);
                launches = LaunchHelpers.addStatisticData(launches);

                var seriesData = GetChartsData.series(launches);
                var labels = GetChartsData.labels(launches, true);

                testplan.charts.push(
                    GetChartStructure(
                        'column',
                        labels,
                        SeriesStructure.getAll(seriesData.percents.failed, seriesData.percents.skipped, seriesData.percents.total),
                        Tooltips.envVar()
                    ));
            });
        };
    }
]);
