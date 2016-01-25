'use strict';

var app = angular.module('testReport.dashboard.top', [
    'ngRoute'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard/:projectId/top', {
        templateUrl: '/static/app/partials/dashboard/top/top.html',
        controller: 'DashboardTopCtrl'
    });
}]);

app.controller('DashboardTopCtrl', ['$scope', '$rootScope', '$filter', '$routeParams', '$location', '$window','appConfig', 'Project', 'TestPlan', 'Launch', 'TestResult',
    function ($scope, $rootScope, $filter, $routeParams, $location, $window, appConfig, Project, TestPlan, Launch, TestResult) {
        $scope.projects = [];
        $scope.loading = false;

        if ($routeParams.projectId) {
            $rootScope.selectProject($routeParams.projectId);
            Project.get({ projectId: $routeParams.projectId }, function (response) {
                $scope.projects.push(response);
                fetchData();
            });
        }

        function fetchData() {
            _.each($scope.projects, function (project) {
                project.testplans = [];
                project.statistics = [];
                TestPlan.get({ projectId: project.id }, function (response) {
                    _.each(response.results, function (testplan) {
                        if (testplan.hidden === false) {
                            if (testplan.main === true) {
                                project.statistics.push(testplan);
                            }
                            project.testplans.push(testplan);
                        } else {
                            if ($rootScope.profile && testplan.owner === $rootScope.profile.id) {
                                if (testplan.main === true) {
                                    project.statistics.push(testplan);
                                }
                                project.testplans.push(testplan);
                            }
                        }
                    });
                    project.statistics = _.sortBy(project.statistics, 'name');
                    _.each(project.statistics, function (statistic_testplan) {
                        $scope.prepareResults(statistic_testplan, 3);
                    });
                });
            });
        }

        $scope.prepareResults = function(testplan, days) {
            testplan.days = days;
            testplan.launch_ids = [];
            testplan.top = [];
            testplan.loading = false;
            Launch.custom_list({
                testPlanId: testplan.id,
                state: appConfig.LAUNCH_STATE_FINISHED,
                days: days,
                page: 1,
                search: testplan.filter

            }, function (launches) {
                if (launches.results.length !== 0) {
                    var ids = _.map(launches.results, function (launch) {
                        return launch.id;
                    });

                    TestResult.custom_list({
                        launch_id__in: ids.join(),
                        state: appConfig.TESTRESULT_FAILED,
                        page: 1,
                        page_size: 9999
                    }, function (results) {
                        testplan.loading = true;

                        _.each(results.results, function(result) {
                            result.fullname = result.suite + ' ' + result.name;
                        });

                        var groupNames = _.groupBy(results.results, 'fullname');
                        _.each(groupNames, function (val, key) {
                            if (val.length !== 1) {
                                testplan.top.push({
                                    name: key,
                                    count: val.length,
                                    id: _.max(val, function(result){ return result.id; }).id
                                });
                            }
                        });
                        testplan.top = _.sortBy(testplan.top, 'count');
                        testplan.top.reverse();
                    });
                } else {
                    testplan.loading = true;
                }
            });
        }

        //for button in active state
        $('body').on('click', '.btn-group button', function (e) {
            $(this).addClass('active');
            $(this).siblings().removeClass('active');
        });

        $scope.redirect = function(evt, url) {
            (evt.button === 1 || evt.ctrlKey === true) ?
                $window.open('#' + url, '_blank') : $location.path(url);
        };
    }
]);
