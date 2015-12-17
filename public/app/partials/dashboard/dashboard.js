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
            $scope.testplans = _.filter(response.results, Filters.isMain);
            $scope.testplans = _.filter($scope.testplans, Filters.removeHidden);
            $scope.testplans = _.sortBy($scope.testplans, 'name');

            _.each($scope.testplans, function (testplan) {
                $scope.addChartsToTestplan(testplan, appConfig.DEFAULT_DAYS);
            });

            $scope.summaryTestplans = $scope.testplans;

            $scope.chartsType = $rootScope.getProjectChartsType($routeParams.projectId);
            $scope.draw(appConfig.DEFAULT_DAYS);
        });

        Stage.get({ projectId: $routeParams.projectId }, function (response) {
           $scope.stages = _.sortBy(response.results, 'weight');
        });

        $scope.draw = function(days) {
            $scope.addLaunchesToTestplans($scope.summaryTestplans, days).then(function(launches) {
                var dates = [];
                _.each(launches, function(launch) {
                    _.extend(dates, _.keys(launch));
                });

                var new_launches = {};
                _.each(launches, function(launch) {
                    _.each(launch, function(value, key) {
                        if (new_launches[key]) {
                            var counts = _.max(value, 'id').counts;
                            new_launches[key].counts.failed += counts.failed;
                            new_launches[key].counts.skipped += counts.skipped;
                            new_launches[key].counts.passed += counts.passed;
                            new_launches[key].counts.blocked += counts.blocked;
                            new_launches[key].counts.total += counts.total;
                        } else {
                            new_launches[key] = _.max(value, 'id');
                        }
                    });
                });

                new_launches = _.values(new_launches);
                new_launches = LaunchHelpers.addStatisticData(new_launches);
                new_launches = _.sortBy(new_launches, 'created');

                var seriesData = GetChartsData.series(new_launches);
                var labels = GetChartsData.labels(new_launches);

                $scope.charts = [];
                if ($scope.chartsType === appConfig.CHART_TYPE_COLUMN) {
                    $scope.charts.push(
                        GetChartStructure(
                            'column',
                            labels,
                            SeriesStructure.getFailedAndSkipped(seriesData.percents.failed, seriesData.percents.skipped)
                        ));

                    $scope.charts.push(
                        GetChartStructure(
                            'column',
                            labels,
                            SeriesStructure.getTotal(seriesData.percents.total),
                            Tooltips.total()
                        ));
                }

                if ($scope.chartsType === appConfig.CHART_TYPE_AREA) {
                    $scope.charts.push(
                        GetChartStructure(
                            'area_percent',
                            labels,
                            SeriesStructure.getPercent(seriesData.percents.failed, seriesData.percents.skipped, seriesData.percents.passed),
                            Tooltips.areaPercent()
                        ));

                    $scope.charts.push(
                        GetChartStructure(
                            'area_absolute',
                            labels,
                            SeriesStructure.getAbsolute(seriesData.absolute.failed, seriesData.absolute.skipped, seriesData.absolute.passed),
                            Tooltips.areaAbsolute()
                        ));
                }
            });
        };

        $scope.addLaunchesToTestplans = function(testplans, days) {
            var promises = [];
            _.each(testplans, function(testplan) {
                var promise = $scope.getLaunches(testplan, days);
                promises.push(promise);
            });
            return $q.all(promises);
        };

        $scope.getLaunches = function(testplan, days) {
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
        };

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

                if ($scope.chartsType === appConfig.CHART_TYPE_COLUMN) {
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
                }

                if ($scope.chartsType === appConfig.CHART_TYPE_AREA) {
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
    }
]);
