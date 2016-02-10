'use strict';

app.controller('Menu', ['$rootScope', '$routeParams','$scope', '$location', '$window', 'Project', 'TestPlan', 'Auth', 'isSafari','$q',
    function ($rootScope, $routeParams, $scope, $location, $window, Project, TestPlan, Auth, isSafari, $q) {
        $scope.isSafari = isSafari;
        $scope.jira = JIRA_INTEGRATION;
        $scope.xmasTree = showXmasTree();

        //hide menu if hideMenu=true
        var scope = $routeParams;
        $scope.$watch(function (){return scope.hideMenu;}, function (value) {
            if(value) {
                $("body").css("padding-top", "0px");
            } else {
                $("body").css("padding-top", "50px");
            }
            $scope.hideMenu = !!value;
        });

        $scope.activeProject = null;
        $scope.activeProjectId = null;
        $scope.logout = function () {
            Auth.api.logout(function () {
                $rootScope.profile = null;
            }, function (result) {
                console.info(result);
            });
        };

        $rootScope.getProfile = function() {
            var deferred = $q.defer();

            if (typeof $rootScope.profile === 'undefined') {
                Auth.api.get_current(function (result) {
                    $rootScope.profile = result;
                    if ($rootScope.profile.settings.default_project !== null && $location.path() === '/dashboard') {
                        $location.path('/dashboard/' + $rootScope.profile.settings.default_project);
                    }
                    deferred.resolve(result);
                }, function () {
                    $rootScope.profile = null;
                    deferred.resolve($rootScope.profile);
                });
            } else {
                deferred.resolve($rootScope.profile);
            }

            return deferred.promise;
        };

        $rootScope.getProjects = function() {
            var deferred = $q.defer();

            Project.query(function (result) {
                deferred.resolve(result.results);
            }, function (result) {
                $rootScope.api_path = API_PATH;
                deferred.reject(result);
            });

            return deferred.promise;
        };

        $rootScope.getProfile();

        $rootScope.reloadProjects = function () {

            $rootScope.getProjects().then(function(projects) {
                $rootScope.projects = projects;
                _.each($rootScope.projects, function(project) {
                    _.each(project.settings, function(setting) {
                        project[setting.key] = setting.value;
                    });
                });

                TestPlan.custom_list({ projectsIds: _.map($rootScope.projects, function (item) { return item.id})}, function (result) {
                    _.each($rootScope.projects, function (project) {
                        project.testplans = _.sortBy(
                            _.filter(result.results, function (testplan) { return testplan.project === project.id }),
                            'name');
                    });
                });
            });
        };

        $rootScope.reloadProjects();

        $scope.$watch('projects', function () {
            $scope.activeProject = $scope.findProjectById($scope.activeProjectId);
        });

        $scope.$watch('activeProjectId', function () {
            $scope.activeProject = $scope.findProjectById($scope.activeProjectId);
        });

        $scope.findProjectById = function (id) {
            var data = _.filter($rootScope.projects, function (project) { return project.id === parseInt(id)});
            return data[0];
        };

        $rootScope.selectProject = function (id) {
            id = (typeof id === 'undefined') ? null : id;
            if (id !== $scope.activeProjectId) {
                $scope.activeProjectId = id;
            }
        };

        $rootScope.getActiveProject = function() {
            return $scope.activeProjectId;
        };

        $rootScope.getProjectSettings = function(id, setting_name) {
            var project = $scope.findProjectById(id);
            var res = _.filter(project.settings, function (item) {
                return item.key && item.key === setting_name;
            });
            if (res.length === 1) {
                return res[0].value;
            }
            return 0;
        };

        $scope.login = function () {
            $rootScope.originLoginPath = $location.path();
            $location.path('/auth/login/');
        };

        function showXmasTree() {
            var today = new Date();
            var year = today.getFullYear();

            var startDate = new Date(year, 11, 15);
            var finishDate = new Date(year, 0, 15);
            if ((today > startDate && today > finishDate) ||
                (today < startDate && today < finishDate)) {
                return true;
            }
            return false;
        }

        $rootScope.redirect = function(evt, url) {
            (evt.button === 1 || evt.ctrlKey === true) ?
                $window.open('#' + url, '_blank') : $location.path(url);
        };
    }
]);
