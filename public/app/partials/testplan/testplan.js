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
        $routeProvider.when('/testplan/:testPlanId/?version=:version&hash=:hash&branch=:branch', {
            templateUrl: '/static/app/partials/testplan/testplan.html',
            controller: 'TestPlanCtrl',
            redirectTo: '/testplan/:testPlanId/'
        });
        $routeProvider.when('/testplan/:testPlanId', {
            templateUrl: '/static/app/partials/testplan/testplan.html',
            controller: 'TestPlanCtrl'
        });
    }
]);

app.controller('TestPlanCtrl', ['$rootScope', '$scope', '$q', '$window', '$location', '$routeParams', '$filter', '$interval',
    'ngTableParams', 'appConfig', 'TestPlan', 'Launch', 'LaunchItem', 'SortLaunchItems', 'Comment', 'ChartConfig',
    'GetChartsData', 'SeriesStructure', 'Tooltips', 'LaunchHelpers', 'GetChartStructure', 'LaunchFilters', 'Periods',
    function ($rootScope, $scope, $q, $window, $location, $routeParams, $filter, $interval,
              ngTableParams, appConfig, TestPlan, Launch, LaunchItem, SortLaunchItems, Comment, ChartConfig,
              GetChartsData, SeriesStructure, Tooltips, LaunchHelpers, GetChartStructure, LaunchFilters, Periods) {
        $scope.chartPercentType = 'failed';
        $scope.maxSymbolsForBranch = 11;
        $rootScope.isMainDashboard = false;
        $scope.refreshTurnOn = false;

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

        $scope.createPage = function() {
            TestPlan.get({'testPlanId': $routeParams.testPlanId}, function (result) {
                $scope.projectId = result.project;
                $rootScope.selectProject(result.project);
                $scope.testplan = result;
                $scope.name = result.name;
                $rootScope.getProjectSettings(result.project, 'chart_type').then(function(type) {
                    $scope.chartsType = parseInt(type);
                    if ($scope.chartsType === appConfig.CHART_TYPE_AREA) {
                        $scope.chartPercentType = 'number';
                        $scope.addChartsToTestplan();
                    }
                    $rootScope.getProfile().then(function(profile){
                        drawTable(profile);
                    });
                });
            });
        };

        $scope.createPage();

        $scope.$watch('refreshTurnOn', function() {
            if ($scope.refreshTurnOn) {
                $interval(function() {
                    $scope.createPage();
                }, $scope.refreshInterval * 60 * 1000);
            }
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

                    if ($routeParams.version) {
                        params.$params.filter.version = $routeParams.version;
                        delete($routeParams.version);
                    }
                    if ($routeParams.branch) {
                        params.$params.filter.branch = $routeParams.branch;
                        delete($routeParams.branch);
                    }
                    if ($routeParams.hash) {
                        params.$params.filter.hash = $routeParams.hash;
                        delete($routeParams.hash);
                    }

                    if (_.isEmpty(params.$params.filter)) {
                        $scope.linkToFilter = $location.path();
                    }

                    Launch.get({
                        testPlanId: $routeParams.testPlanId,
                        page: params.page(),
                        pageSize: params.count(),
                        ordering: ordering,
                        search: params.$params.filter.started_by,
                        build__version: params.$params.filter.version,
                        build__hash: params.$params.filter.hash,
                        build__branch: params.$params.filter.branch
                    }, function (result) {
                        params.total(result.count);
                        tableData = result.results.map(updateStats);
                        markSuccessLaunch(tableData);
                        $defer.resolve(tableData);

                        formLink(params.$params.filter);

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
                        $scope.charts[0].yAxis.tickInterval = 5;
                        $scope.charts[0].yAxis.title.text = 'hh:mm:ss';
                        $scope.charts[0].yAxis.labels = {
                            enabled: false
                            //formatter: function() {
                            //    return $filter('secondsToTime')(this.value);
                            //}
                        };

                        $scope.charts.push(
                            GetChartStructure(
                                'line',
                                labels,
                                SeriesStructure.getMetrics(seriesData.metrics)
                            ));

                        $scope.charts[1].options.plotOptions.series.connectNulls = true;
                        $scope.charts[1].credits = {
                            enabled: true,
                            text: 'click to expand',
                            href: '#testplan/'+ $routeParams.testPlanId + '/metrics',
                            position: {
                                align: 'right',
                                x: 0
                            },
                            style: {
                                cursor: 'pointer',
                                color: '#909090',
                                fontSize: '14px'
                            }
                        };
                        $scope.charts[1].options.plotOptions.series.point = {
                            events: {
                                click: function () {
                                    if (isUrl(this.started_by)) {
                                        $window.open(this.started_by);
                                    } else {
                                        $rootScope.$apply($location.path('/launch/' + this.id));
                                    }
                                }
                            }
                        };

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

        function checkTestPlanExistent(testplan) {
            var exist = false;
            _.each($rootScope.findProjectById($scope.projectId).testplans, function(tp) {
                if (testplan.name === tp.name && testplan.id !== tp.id) {
                    exist = true;
                }
            });
            return exist;
        }

        $scope.updateTestPlan = function (testplan) {
            $scope.formUpdate = null;
            if (checkTestPlanExistent(testplan)) {
                $scope.formErrors = 'Testplan "'+ testplan.name + '" already exists. ' +
                        'Please, choose another name.';
                return;
            }
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

        function formLink(filter) {
            $scope.linkToFilter = $location.path();
            var params = [];
            if (filter.version) {
                params.push('version=' + filter.version);
            }
            if (filter.hash) {
                params.push('hash=' + filter.hash);
            }
            if (filter.branch) {
                params.push('branch=' + filter.branch);
            }
            if (params.length !== 0) {
                $scope.linkToFilter += '?' + params.join('&');
            }
        }

        // for hide alert-info after click
        $('body').on('click', '.alert alert-info', function (e) {
            $(this).removeClass('.alert alert-info');
        });

        $scope.redirect = function(evt, url) {
            var selection = $window.getSelection();
            if (selection.type === 'Range') {
                return false;
            }
            (evt.button === 1 || evt.ctrlKey === true) ?
                $window.open('#' + url, '_blank') : $location.path(url);
        }


        //code for dynamics chart
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

        function getLaunchesForPeriods(testplan) {
            var promises = [];
            var dateList = Periods.period_list(true);
            _.each([dateList['1 month'], dateList['6 months']], function(days) {
                var promise = getLaunches(testplan, days);
                promises.push(promise);
            });
            return $q.all(promises);
        }

        $scope.dynamics = [];
        $scope.addChartsToTestplan = function() {
            getLaunchesForPeriods($scope.testplan).then(function(periodLaunches) {
                _.each(periodLaunches, function(launches) {
                    launches = LaunchHelpers.cutDate(launches);
                    launches = LaunchFilters.getMax(launches);
                    launches = _.filter(launches, LaunchFilters.isEmptyResults);
                    launches = LaunchHelpers.addStatisticData(launches);
                    launches = _.sortBy(launches, 'id');

                    var seriesData = GetChartsData.series(launches);
                    var labels = GetChartsData.labels(launches);

                    if ($scope.chartsType === appConfig.CHART_TYPE_AREA) {
                        pushAreaCharts(labels, seriesData);
                    }
                });
                $scope.dynamics[0].subtitle.text = '1 month';
                $scope.dynamics[1].subtitle.text = '6 months';
                $scope.dynamics[0].options.legend.enabled = false;
                $scope.dynamics[1].options.legend.enabled = false;
            });
        };

        function pushAreaCharts(labels, series) {
            $scope.dynamics.push(GetChartStructure(
                    'area_absolute',
                    labels,
                    SeriesStructure.getAbsolute(series.absolute.failed, series.absolute.skipped,
                        series.absolute.passed),
                    //SeriesStructure.getTotal(series.absolute.total),
                    Tooltips.areaAbsolute()
                ));
        }

        $scope.startTimer = function() {
            if (typeof $scope.refreshInterval ==='number' && $scope.refreshInterval >= 1) {
                $scope.refreshTurnOn = true;
            } else {
                $scope.refreshTurnOn = false;
            }
        };

        $scope.stopTimer = function() {
            $scope.refreshTurnOn = false;
            delete $scope.refreshInterval;
        };
    }
]);
