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

app.controller('DashboardCtrl', ['$q', '$scope', '$rootScope', '$routeParams', 'appConfig', 'TestPlan', 'Launch', 'Stage', 'Filters', 'LaunchHelpers', 'LaunchFilters', 'GetChartsData', 'SeriesStructure', 'Tooltips', 'GetChartStructure',
    function ($q, $scope, $rootScope, $routeParams, appConfig, TestPlan, Launch, Stage, Filters, LaunchHelpers, LaunchFilters, GetChartsData, SeriesStructure, Tooltips, GetChartStructure) {
        $rootScope.selectProject($routeParams.projectId);
        $rootScope.isMainDashboard = false;

        TestPlan.get({ projectId: $routeParams.projectId }, function (response) {

            $scope.summaryTestplans = _.filter(response.results, Filters.isSummary);
            $scope.summaryTestplans = _.filter($scope.summaryTestplans, Filters.removeHidden);

            $scope.testplans = _.filter(response.results, Filters.isMain);
            $scope.testplans = _.filter($scope.testplans, Filters.removeHidden);
            $scope.testplans = _.sortBy($scope.testplans, 'name');

            _.each($scope.testplans, function (testplan) {
                $scope.addChartsToTestplan(testplan, appConfig.DEFAULT_DAYS);
            });

            $scope.chartsType = $rootScope.getProjectChartsType($routeParams.projectId);
            $scope.createTotalChart(appConfig.DEFAULT_DAYS);
        });

        Stage.get({ projectId: $routeParams.projectId }, function (response) {
           $scope.stages = _.sortBy(response.results, 'weight');
        });

        $scope.createTotalChart = function(days) {
            addLaunchesToTestplans($scope.summaryTestplans, days).then(function(launches) {
                var launches = LaunchHelpers.sumLaunchesByDate(launches);
                launches = LaunchHelpers.addStatisticData(launches);
                launches = _.sortBy(launches, 'created');

                var seriesData = GetChartsData.series(launches);
                var labels = GetChartsData.labels(launches);

                $scope.charts = [];
                if ($scope.chartsType === appConfig.CHART_TYPE_COLUMN) {
                    pushColumnCharts($scope.charts, labels, seriesData);
                }

                if ($scope.chartsType === appConfig.CHART_TYPE_AREA) {
                    pushAreaCharts($scope.charts, labels, seriesData);
                }
            });
        };

        function addLaunchesToTestplans(testplans, days) {
            var promises = [];
            _.each(testplans, function(testplan) {
                var promise = getLaunches(testplan, days);
                promises.push(promise);
            });
            return $q.all(promises);
        }

        function getLaunches (testplan, days) {
            var deferred = $q.defer();
            Launch.custom_list({
                testPlanId: testplan.id,
                state: appConfig.LAUNCH_STATE_FINISHED,
                days: days,
                search: testplan.filter
            }, function (response) {
                var launches = LaunchHelpers.cutDate(response.results);
                launches = _.groupBy(launches, 'groupDate');
                deferred.resolve(launches);
            });
            return deferred.promise;
        }

        $scope.addChartsToTestplan = function(testplan, days) {
            testplan.days = days;
            getLaunches(testplan, days).then(function(launches) {
                testplan.charts = [];

                //launches for common chart by date
                launches = LaunchHelpers.cutDate(launches);
                launches = LaunchFilters.getMax(launches);
                launches = _.filter(launches, LaunchFilters.isEmptyResults);
                launches = LaunchHelpers.addStatisticData(launches);
                launches = _.sortBy(launches, 'id');

                var seriesData = GetChartsData.series(launches);
                var labels = GetChartsData.labels(launches);

                if ($scope.chartsType === appConfig.CHART_TYPE_COLUMN) {
                    pushColumnCharts(testplan.charts, labels, seriesData);
                }

                if ($scope.chartsType === appConfig.CHART_TYPE_AREA) {
                    pushAreaCharts(testplan.charts, labels, seriesData);
                }

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

        function pushColumnCharts(charts, labels, series) {
            charts.push(
                GetChartStructure(
                    'column',
                    labels,
                    SeriesStructure.getFailedAndSkipped(series.percents.failed, series.percents.skipped)
                ));

            charts.push(
                GetChartStructure(
                    'column',
                    labels,
                    SeriesStructure.getTotal(series.percents.total),
                    Tooltips.total()
                ));
        }

        function pushAreaCharts(charts, labels, series) {
            charts.push(
                GetChartStructure(
                    'area_percent',
                    labels,
                    SeriesStructure.getPercent(series.percents.failed, series.percents.skipped, series.percents.passed),
                    Tooltips.areaPercent()
                ));

            charts.push(
                GetChartStructure(
                    'area_absolute',
                    labels,
                    SeriesStructure.getAbsolute(series.absolute.failed, series.absolute.skipped, series.absolute.passed),
                    Tooltips.areaAbsolute()
                ));
        }
    }
]);
