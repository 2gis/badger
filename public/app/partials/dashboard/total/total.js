'use strict';

var app = angular.module('testReport.dashboard.total', [
    'ngRoute',
    'ngTable'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/dashboard/:projectId/launches/from=:from&to=:to', {
        templateUrl: '/static/app/partials/dashboard/total/total.html',
        controller: 'DashboardTotalCtrl'
    });
    $routeProvider.when('/dashboard/:projectId/launches/from=:from&to=:to/:version', {
        templateUrl: '/static/app/partials/dashboard/total/total.html',
        controller: 'DashboardTotalCtrl'
    });
}]);

app.controller('DashboardTotalCtrl', ['$scope', '$rootScope', '$filter', '$routeParams', 'ngTableParams', 'appConfig', 'Filters', 'TestPlan', 'Launch', 'TestResult',
    function ($scope, $rootScope, $filter, $routeParams, ngTableParams, appConfig, Filters, TestPlan, Launch, TestResult) {
        $rootScope.selectProject($routeParams.projectId);
        $rootScope.isMainDashboard = false;
        $scope.initGroupBy = 'suite';

        $scope.columns = [
            { title: 'Version', visible: true },
            { title: 'Hash', visible: false },
            { title: 'Branch', visible: false },
            { title: 'Testplan', visible: true },
            { title: 'Suite', visible: true },
            { title: 'sec.', visible: true },
            { title: 'Bugs', visible: true }
        ];

        $scope.getColumnVisibility = function(title) {
            return (_.find($scope.columns, function(column) {
                return column.title === title;
            })).visible;
        };

        var delta = new Date($routeParams.to) - new Date($routeParams.from);
        if (delta / 1000 / 60 / 60/ 24 > 7) {
            $scope.formErrors = 'Period can\'t be more than 7 days.';
            return;
        }

        function dateFormat(date) {
            date = new Date(date);
            return date.toISOString().substring(0, 10);
        }

        function getId(object) {
            return object.id;
        }

        TestPlan.get({ projectId: $routeParams.projectId }, function (response) {
            $scope.twodaysTestplans = _.filter(response.results, Filters.isTwodays);
            $scope.twodaysTestplans = _.filter($scope.twodaysTestplans, Filters.removeHidden);
            $scope.twodaysTestplans = _.sortBy($scope.twodaysTestplans, 'name');

            if ($scope.twodaysTestplans.length === 0) {
                $scope.formErrors = 'No testplans in two days dashboard.';
                return;
            }
            var ids = _.map($scope.twodaysTestplans, getId);

            $scope.names = {};
            _.each($scope.twodaysTestplans, function(plan) {
                $scope.names[plan.id] = plan.name;
            });

            Launch.custom_list({
                testplan_id__in: ids.join(),
                from: dateFormat($routeParams.from),
                to: dateFormat($routeParams.to),
                build__version: $routeParams.version
            }, function (launches) {
                if (launches.count === 0) {
                    $scope.formErrors = 'No launches for this period.';
                    return;
                }
                $scope.launches = launches.results;

                TestResult.custom_list({
                    launch_id__in: _.map($scope.launches, getId).join(),
                    page: 1,
                    pageSize: 9999,
                    state__in: ([appConfig.TESTRESULT_FAILED, appConfig.TESTRESULT_BLOCKED]).join()
                }, function (result) {
                    drawTable(result);
                });
            });
        });

        function drawTable(results) {
            $scope.tableParams = treeTable(results);
        }

        function treeTable(result) {
            return new ngTableParams({
                count: 99999,
                sorting: {
                    launch: 'desc'
                }
            }, {
                total: 0,
                groupBy: $scope.initGroupBy,
                getData: function ($defer, params) {
                    params.total(result.count);
                    $scope.data = result.results;
                    $scope.data = params.sorting() ? $filter('orderBy')($scope.data, params.orderBy()) : $scope.data;
                    $scope.data = params.filter() ? $filter('filter')($scope.data, params.filter()) : $scope.data;

                    var launchesByIds = _.groupBy($scope.launches, 'id');
                    _.each($scope.data, function(testResult) {
                        var launch = launchesByIds[testResult.launch][0];
                        testResult.created = launch.created;
                        testResult.version = _.isObject(launch.build) ? launch.build.version : '';
                        testResult.hash = _.isObject(launch.build) ? launch.build.hash : '';
                        testResult.branch = _.isObject(launch.build) ? launch.build.branch : '';
                        testResult.testplan = $scope.names[launch.test_plan];
                    });

                    $defer.resolve($scope.data);
                    $scope.tableParams.settings({counts: []});
                }
            });
        }

        $scope.$watch('initGroupBy', function(value){
            $scope.tableParams.settings().groupBy = value;
            $scope.tableParams.reload();
        });

        $scope.openResults = function (item) {
            var modal = $('#TestDetailsModal');
            modal.modal('hide');
            $scope.modalSuite = item.suite;
            $scope.modalName = item.name;
            $scope.modalState = item.state;
            $scope.modalBody = item.failure_reason;
            $scope.modalId = item.id;
            modal.modal('show');
        };

        $(".modal-wide").on("show.bs.modal", function() {
          var height = $(window).height() - 250;
          $(this).find(".modal-body").css("max-height", height);
        });

    }
]);
