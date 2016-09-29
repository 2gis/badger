'use strict';

var app = angular.module('testReport.project.settings', [
    'ngRoute',
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/project/:projectId/settings', {
        templateUrl: '/static/app/partials/project/settings/settings.html',
        controller: 'ProjectSettingsCtrl'
    });
}]);

app.controller('ProjectSettingsCtrl', ['$rootScope', '$scope', '$routeParams', '$q', '$filter', '$location', 'Auth', 'Project',
    function ($rootScope, $scope, $routeParams, $q, $filter, $location, Auth, Project) {
        $rootScope.isMainDashboard = false;
        $scope.formErrors = null;

        var admin_settings = ['chart_type', 'results_view', 'weight', 'current_build'];

        if(!$rootScope.getActiveProject()) {
            $rootScope.selectProject($routeParams.projectId);
        }
        $scope.activeProjectId = $rootScope.getActiveProject();

        function reloadSettings() {
            $rootScope.getProjectSettings($routeParams.projectId, '').then(function(result) {
                _.each(result, function(item) {
                    item.$save = true;
                });
                $scope.settings = _.sortBy(_.filter(result, function(item) {
                    return !_.contains(admin_settings, item.key);
                }), 'key');
            });
        }

        reloadSettings();

        $scope.addSettingsItem = function() {
            $scope.settings.push({ key: '', value: '' , $edit: true, $save: false });
        };

        $scope.cancelSettingsItem = function(item, index) {
            $scope.formErrors = null;
            if (!item.$save) {
                $scope.settings.splice(index, 1);
            }
            item.$edit = false;
        };

        $scope.updateSettings = function (item) {
            $scope.formErrors = null;
            if (!item.$save && checkKeyExistent(item.key)) {
                $scope.formErrors = 'Key "' + item.key + '" already exists.';
                return;
            }
            if (item.key === '') {
                return;
            }
            item.$edit = false;
            Project.save_settings({ projectId: $scope.activeProjectId }, item, function(result) {
                if (result.message === 'ok') {
                    item.$save = true;
                }
            }, function(result) {
                $scope.formErrors = result.data.detail;
            });
        };

        $scope.deleteSettings = function (item) {
            var modal = $('#ConfirmationModal');
            $scope.modalTitle = 'Attention';
            $scope.modalBody = 'Are you sure you want to delete key "' + item.key + '" with value "' + item.value + '"?';
            $scope.modalCallBack = function () {
                Project.delete_settings({ projectId: $scope.activeProjectId }, item, function(result) {
                    if (result.message === 'ok') {
                        reloadSettings();
                    }
                }, function(result) {
                    $scope.formErrors = result.data.detail;
                });
            };
            modal.modal('show');
        };

        function checkKeyExistent(key) {
            var saved_settings_keys = [];
            _.each($scope.settings, function(item) {
                if (item.$save) {
                    saved_settings_keys.push(item.key);
                }
            });
            return _.contains(saved_settings_keys, key);
        }
    }
]);
