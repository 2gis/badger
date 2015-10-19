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

app.controller('TestPlanCtrl', ['$rootScope', '$scope', '$location', '$routeParams', '$filter', 'ngTableParams', 'appConfig', 'TestPlan', 'Launch', 'LaunchItem', 'SortLaunchItems', 'Comment', 'ChartConfig',
    function ($rootScope, $scope, $location, $routeParams, $filter, ngTableParams, appConfig, TestPlan, Launch, LaunchItem, SortLaunchItems, Comment, ChartConfig) {
        $scope.chartPercentType = 'failed';

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

            return item;
        }

        TestPlan.get({'testPlanId': $routeParams.testPlanId}, function (result) {
            $rootScope.selectProject(result.project);
            $scope.testplan = result;
            $scope.name = result.name;
        });

        $scope.testPlanId = $routeParams.testPlanId;
        $scope.location = $location;

        $scope.activeTab = 'history';

        $scope.launchItems = new ngTableParams({
                page: 1,
                count: 10000,
                sorting: { created: 'desc' }
            },{
                total: 0,
                counts: [],
                getData: function($defer, params) {
                    $scope.tableParams.settings({ counts: [10, 25, 50] });
                    var tableData, ordering;
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

        $scope.tableParams = new ngTableParams({
            page: 1,
            count: 10,
            sorting: {
                created: 'desc'
            }
        }, {
            total: 0,
            getData: function($defer, params) {
                var tableData,
                    ordering;

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
                    $defer.resolve(tableData);

                    $scope.labels = [];
                    $scope.skipped = [];
                    $scope.failed = [];
                    $scope.duration = [];

                    tableData.forEach(function(item){
                        var duration = item.duration ? parseInt(item.duration / 60) :
                            parseInt((Date.parse(item.finished) - Date.parse(item.created)) / (1000 * 60));
                        var d = new Date(item.created);
                        var options = { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'};
                        $scope.labels.unshift(d.toLocaleString(LANG, options));
                        $scope.failed.unshift({ y: item.percent_of_failed, id: item.id });
                        $scope.skipped.unshift({ y: item.percent_of_skipped, id: item.id });
                        $scope.duration.unshift({ y: duration, id: item.id });

                        $scope.failedConfig = ChartConfig.column();
                        $scope.failedConfig.xAxis.categories = $scope.labels;
                        $scope.failedConfig.yAxis.title.text = '%';
                        $scope.failedConfig.series.push({
                            name: '% of failed tests',
                            data: $scope.failed,
                            color: appConfig.CHART_COLORS.red
                        });

                        $scope.skippedConfig = ChartConfig.column();
                        $scope.skippedConfig.xAxis.categories = $scope.labels;
                        $scope.skippedConfig.yAxis.title.text = '%';
                        $scope.skippedConfig.series.push({
                            name: '% of skipped tests',
                            data: $scope.skipped,
                            color: appConfig.CHART_COLORS.yellow
                        });

                        $scope.durationConfig = ChartConfig.column();
                        $scope.durationConfig.xAxis.categories = $scope.labels;
                        $scope.durationConfig.yAxis.title.text = 'min';
                        $scope.durationConfig.series.push({
                            name: 'launch duration',
                            data: $scope.duration,
                            color: appConfig.CHART_COLORS.green
                        });
                        $scope.durationConfig.options.tooltip = {
                        formatter: function() {
                            return this.y + ' min';
                        }
                    };
                    });

                    if ($scope.failed.length !== 0 && $scope.skipped.length !== 0) {
                        $scope.dataFailed = [$scope.failed];
                        $scope.dataSkipped = [$scope.skipped];
                    }
                });
            }
        });

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
                            $location.path('/');
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
    }
]);
