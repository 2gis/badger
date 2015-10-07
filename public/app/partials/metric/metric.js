'use strict';

var app = angular.module('testReport.metric', [
    'ngRoute',
    'angular-cron-jobs'
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId/metrics', {
        templateUrl: '/static/app/partials/metric/metric.html',
        controller: 'MetricCtrl'
    });
}]);

app.controller('MetricCtrl', ['$rootScope', '$scope', '$routeParams', '$filter', 'Metric',
    function ($rootScope, $scope, $routeParams, $filter, Metric) {
        if(!$rootScope.getActiveProject()) {
            $rootScope.selectProject($routeParams.projectId);
        }
        $scope.activeProjectId = $rootScope.getActiveProject();

        $scope.options = [
            {name: 'Total count', code: 'count'},
            {name: 'Cycle time', code: 'cycletime'},
            {name: 'Lead time', code: 'leadtime'}
        ];

        $scope.reloadMetrics = function() {
            Metric.get({project: $routeParams.projectId}, function (response) {
                $scope.metrics = _.sortBy(response.results, 'weight');
            });
        };

        $scope.reloadMetrics();

        $scope.deleteMetric = function (metric) {
            var modal = $('#ConfirmationModal');
            $scope.modalTitle = 'Attention';
            $scope.modalBody = 'Are you sure you want to delete metric "' + metric.name + '" and all values?';
            $scope.objectId = metric.id;
            $scope.modalCallBack = function () {
                Metric.delete({metricId: $scope.objectId},
                    function (result) {
                        if (result.message === 'Metric and all values deleted') {
                            $scope.reloadMetrics();
                        }
                    },
                    function (result) {
                        $scope.formErrors = result.data.detail;
                    }
                )
            };
            modal.modal('show');
        };

        $scope.updateMetric = function (metric) {
            Metric.update({metricId: metric.id}, metric,
                function (result) {
                    metric.formUpdate = 'Metric updated successfully';
                    metric.formErrors = null;
                },
                function (result) {
                    metric.formUpdate = null;
                    if (result.data.detail) {
                        metric.formErrors = result.data.detail;
                    }
                    if (result.data.message) {
                        metric.formErrors = result.data.message;
                    }

                }
            );
        };
    }
]);
