'use strict';

var app = angular.module('testReport.mainDashboard', [
    'ngRoute',
    'testReportServices',
    'testReportServicesDashboard',
    'highcharts-ng'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard', {
        templateUrl: '/static/app/partials/dashboard/main_dashboard.html',
        controller: 'MainDashboardCtrl'
    });
}]);

app.controller('MainDashboardCtrl', ['$scope', '$rootScope', 'appConfig', 'Project', 'TestPlan', 'Launch', 'Filters', 'LaunchHelpers', 'LaunchFilters', 'GetChartsData', 'SeriesStructure', 'Tooltips', 'GetChartStructure',
    function ($scope, $rootScope, appConfig, Project, TestPlan, Launch, Filters, LaunchHelpers, LaunchFilters, GetChartsData, SeriesStructure, Tooltips, GetChartStructure) {
        $scope.default_days = appConfig.DEFAULT_DAYS;
        $rootScope.isMainDashboard = true;

        Project.query(function (response) {
            $scope.projects = response.results;
            $rootScope.getProfile().then(function(profile) {
                if (profile) {
                    fetchData(profile);
                }
            });
        });

        function fetchData(profile) {
            _.each(profile.settings.dashboards, function(dashboard) {
                TestPlan.custom_list({
                    id__in: getTestplanIds(dashboard.testplans)
                }, function (response) {
                    dashboard.testplans = response.results;
                    _.each(dashboard.testplans, function (testplan) {
                        updateName(testplan);
                        testplan.chartsType = $rootScope.getProjectSettings(testplan.project, 'chart_type');
                        $scope.addChartsToTestplan(testplan, appConfig.DEFAULT_DAYS);
                    });
                    dashboard.testplans = _.sortBy(dashboard.testplans, 'name');
                });
            });
        }

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

                if (testplan.chartsType === appConfig.CHART_TYPE_COLUMN) {
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

                if (testplan.chartsType === appConfig.CHART_TYPE_AREA) {
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
            });
        };

        function getTestplanIds(testplans) {
            var ids = [];
            _.each(testplans, function(tesplan) {
                ids.push(tesplan.id);
            });
            return ids.join();
        }

        function updateName(testplan) {
            _.each($scope.projects, function (project) {
                if (project.id === testplan.project) {
                    testplan.name = project.name + ' - ' + testplan.name;
                }
            });
        }
    }
]);
