'use strict';

var app = angular.module('testReport.testPlan', [
    'ngRoute',
    'ngTable',
    'ngResource',
    'testReportServices',
    'testReportFilters',
    'highcharts-ng'
]);

app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/testplan/:testPlanId', {
            templateUrl: '/static/app/partials/testplan/testplan.html',
            controller: 'TestPlanCtrl'
        });
    }
]);

app.controller('TestPlanCtrl', ['$rootScope', '$scope', '$window', '$location', '$routeParams', '$filter', 'ngTableParams', 'appConfig', 'TestPlan', 'Launch', 'LaunchItem', 'SortLaunchItems', 'Comment', 'ChartConfig', 'GetChartsData', 'SeriesStructure', 'Tooltips', 'LaunchHelpers', 'GetChartStructure',
    function ($rootScope, $scope, $window, $location, $routeParams, $filter, ngTableParams, appConfig, TestPlan, Launch, LaunchItem, SortLaunchItems, Comment, ChartConfig, GetChartsData, SeriesStructure, Tooltips, LaunchHelpers, GetChartStructure) {
        $scope.chartPercentType = 'failed';
        $scope.maxSymbolsForBranch = 8;
        var options = {
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        };

        function markSuccessLaunch(launches) {
            var res = _.filter(launches, function(launch) {
                return launch.state === appConfig.LAUNCH_STATE_SUCCESS;
            });

            if (res.length === 1) {
                res[0].success = true;
            }
        }

        function getPercent(count, total) {
            if (total === 0) {
                return 100.0;
            }

            return (count / total) * 100.0;
        }

        function updateStats(item) {
            _.extend(item, {
                percent_of_failed: getPercent(item.counts.failed + item.counts.blocked, item.counts.total),
                percent_of_skipped: getPercent(item.counts.skipped, item.counts.total)
            });
            Comment.get({
                content_type__name: 'launch',
                object_pk: item.id
            }, function (result) {
                angular.extend(item, {
                    comments: result
                });
            });

            if (item.state === appConfig.LAUNCH_STATE_FINISHED &&
                    item.counts.blocked === 0 && item.counts.failed === 0 && item.counts.passed !== 0) {
                item.state = appConfig.LAUNCH_STATE_SUCCESS;
            }

            return item;
        }

        TestPlan.get({'testPlanId': $routeParams.testPlanId}, function (result) {
            $rootScope.selectProject(result.project);
            $scope.testplan = result;
            $scope.name = result.name;
            $scope.chartsType = $rootScope.getProjectChartsType(result.project);
        });

        $scope.testPlanId = $routeParams.testPlanId;
        $scope.location = $location;

        $scope.activeTab = 'history';

        $scope.launchItems = new ngTableParams({
                page: 1,
                count: 100,
                sorting: { created: 'desc' }
            },{
                total: 0,
                counts: [],
                getData: function($defer, params) {
                    var ordering;
                    for (var prop in params.sorting()) {
                        ordering = prop;
                        if (params.sorting()[prop] !== 'asc') {
                            ordering = '-' + prop;
                        }
                        break;
                    }
                    LaunchItem.get({
                        testPlanId: $routeParams.testPlanId,
                        ordering: '-type'
                    }, function (result) {
                        params.total(result.count);
                        $defer.resolve(SortLaunchItems.byType(result.results));
                    });
            }
        });

        $scope.saveLaunchItem = function (launchItem) {
            LaunchItem.update({itemId: launchItem.id }, launchItem,
                function (result) {
                    $scope.launchItemsErrors = null;
                },
                function (result) {
                    $scope.launchItemsErrors = null;
                    angular.forEach(result.data, function (value, key) {
                        if (!$scope.launchItemsErrors) {
                            $scope.launchItemsErrors = '';
                        }
                        $scope.launchItemsErrors += key + ' : ' + value.join();
                    });
                    $scope.launchItems.reload();
                }
            );
        };

        $scope.deleteLaunchItem = function (launchItem) {
            var modal = $('#ConfirmationModal');
            $scope.modalTitle = 'Attention';
            $scope.modalBody = 'Are you sure you want to delete launch item "' + launchItem.name + '"?';
            $scope.objectId = launchItem.id;
            $scope.modalCallBack = function () {
                LaunchItem.delete({itemId: $scope.objectId},
                    function (result) {
                        $scope.launchItems.reload();
                    },
                    function (result) {
                        _.each(result.data, function (value, key) {
                            if (!$scope.launchItemsErrors) {
                                $scope.launchItemsErrors = '';
                            }
                            $scope.launchItemsErrors += key + ' : ' + value.join();
                        });
                    }
                )
            };
            modal.modal('show');
        };

        var create_table_attempt = 0;

        $rootScope.getProfile().then(function(profile){
            drawTable(profile);
        });

        function drawTable(profile) {
            $scope.tableParams = new ngTableParams({
                page: 1,
                count: 10,
                sorting: { created: 'desc' }
            }, {
                total: 0,
                getData: function ($defer, params) {
                    create_table_attempt += 1;
                    if (profile && create_table_attempt === 1) {
                        $scope.tableParams.$params.count = profile.settings
                            ? profile.settings.launches_on_page : 10;
                    }
                    $scope.tableParams.settings({ counts: [10, 25, 50] });
                    var tableData, ordering;

                    for (var prop in params.sorting()) {
                        ordering = prop;
                        if (params.sorting()[prop] !== 'asc') {
                            ordering = '-' + prop;
                        }
                        break;
                    }

                    Launch.get({
                        testPlanId: $routeParams.testPlanId,
                        page: params.page(),
                        pageSize: params.count(),
                        ordering: ordering,
                        search: params.$params.filter.started_by
                    }, function (result) {
                        params.total(result.count);
                        tableData = result.results.map(updateStats);
                        markSuccessLaunch(tableData);
                        $defer.resolve(tableData);

                        $scope.charts = [];

                        tableData = LaunchHelpers.cutDate(tableData, options);
                        tableData = LaunchHelpers.addDuration(tableData);
                        tableData = LaunchHelpers.addStatisticData(tableData);
                        tableData = _.sortBy(tableData, 'id');
                        var seriesData = GetChartsData.series(tableData);
                        var labels = GetChartsData.labels(tableData);

                        $scope.charts.push(
                            GetChartStructure(
                                'column',
                                labels,
                                SeriesStructure.getDuration(seriesData.duration),
                                Tooltips.duration()
                            ));

                        if ($scope.chartsType === appConfig.CHART_TYPE_COLUMN) {
                            $scope.charts.push(
                                GetChartStructure(
                                    'column',
                                    labels,
                                    SeriesStructure.getFailedAndSkipped(seriesData.percents.failed, seriesData.percents.skipped)
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
                }
            });
        }

        $scope.updateTestPlan = function (testplan) {
            TestPlan.update({testPlanId: testplan.id}, testplan,
                function (result) {
                    $rootScope.reloadProjects();
                    $scope.formErrors = null;
                    $scope.formUpdate = 'Testplan successfully updated';
                    $scope.name = result.name;
                },
                function (result) {
                    $scope.formErrors = result.data;
                }
            );
        };

        $scope.deleteTestPlan = function (testplan) {
            var modal = $('#ConfirmationModal');
            $scope.modalTitle = 'Attention';
            $scope.modalBody = 'Are you sure you want to delete testplan "' + testplan.name + '"?';
            $scope.testplanId = testplan.id;
            $scope.modalCallBack = function () {
                TestPlan.delete({testPlanId: $scope.testPlanId}, testplan,
                    function (result) {
                        $rootScope.reloadProjects();
                        modal.on('hidden.bs.modal', function(){
                            $location.path('/dashboard/' + result.project);
                        });
                    },
                    function (result) {
                        alert(angular.toJson(result));
                    }
                )
            };
            modal.modal('show');
        };

        // for hide alert-info after click
        $('body').on('click', '.alert alert-info', function (e) {
            $(this).removeClass('.alert alert-info');
        });

        $scope.redirect = function(evt, url) {
            (evt.button === 1 || evt.ctrlKey === true) ?
                $window.open('#' + url, '_blank') : $location.path(url);
        }
    }
]);
