(function () {
    'use strict';
    angular
        .module('itsyouonlineApp', ['ngCookies', 'ngMaterial', 'ngRoute', 'ngMessages', 'ngSanitize',
            'monospaced.qrcode',
            'itsyouonline.shared', 'itsyouonline.header', 'itsyouonline.footer', 'itsyouonline.user',
            'itsyouonline.validation', 'pascalprecht.translate'])
        .config(['$mdThemingProvider', themingConfig])
        .config(['$httpProvider', httpConfig])
        .config(['$routeProvider', routeConfig])
        .config(['$translateProvider', translateConfig])
        .factory('authenticationInterceptor', ['$q', '$window', authenticationInterceptor])
        .directive('pagetitle', ['$rootScope', '$timeout', pagetitle])
        .run(['$route', '$cookies', '$rootScope', '$location', runFunction]);

    function themingConfig($mdThemingProvider) {
        $mdThemingProvider.definePalette('blueish', {
            '50': '#f7fbfd',
            '100': '#badeed',
            '200': '#8ec8e2',
            '300': '#55add3',
            '400': '#3ca1cd',
            '500': '#4d738a',
            '600': '#2a7ea3',
            '700': '#236b8a',
            '800': '#1d5872',
            '900': '#17455a',
            'A100': '#f7fbfd',
            'A200': '#badeed',
            'A400': '#3ca1cd',
            'A700': '#236b8a',
            'contrastDefaultColor': 'light',
            'contrastDarkColors': '50 100 200 300 400 A100 A200 A400'
        });
        $mdThemingProvider.theme('default')
            .primaryPalette('blueish');
        $mdThemingProvider.enableBrowserColor({
            palette: 'primary', // Default is 'primary', any basic material palette and extended palettes are available
            hue: '800' // Default is '800'
        });
    }

    function httpConfig($httpProvider) {
        $httpProvider.interceptors.push('authenticationInterceptor');
        //initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
    }

    function authenticationInterceptor($q, $window) {
        return {
            'request': function (config) {
                return config || $q.when(config);
            },
            'response': function (response) {
                return response || $q.when(response);
            },

            'responseError': function (rejection) {
                if (rejection.status === 401 || rejection.status === 403 || rejection.status === 419) {
                    $window.location.href = '/login';
                } else if (rejection.status.toString().startsWith('5')) {
                    $window.location.href = 'error' + rejection.status;
                }
                return $q.reject(rejection);
            }
        };
    }

    function routeConfig($routeProvider) {
        // todo translate page title
        $routeProvider
            .when('/authorize', {
                templateUrl: 'components/user/views/authorize.html',
                controller: 'AuthorizeController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Authorize'
                }
            })
            .when('/company/new', {
                templateUrl: 'components/company/views/new.html',
                controller: 'CompanyController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'New company'
                }
            })
            .when('/organization/:globalid', {
                templateUrl: 'components/organization/views/detail.html',
                controller: 'OrganizationDetailController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Organization detail'
                }
            })
            .when('/profile', {
                templateUrl: 'components/user/views/profile.html',
                controller: 'UserHomeController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Profile'
                }
            })
            .when('/notifications', {
                templateUrl: 'components/user/views/notifications.html',
                controller: 'UserHomeController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Notifications'
                }
            })
            .when('/organizations', {
                templateUrl: 'components/user/views/organizations.html',
                controller: 'UserHomeController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Organizations'
                }
            })
            .when('/authorizations', {
                templateUrl: 'components/user/views/authorizations.html',
                controller: 'UserHomeController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Authorizations'
                }
            })
            .when('/settings', {
                templateUrl: 'components/user/views/settings.html',
                controller: 'UserHomeController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Settings'
                }
            })
            .when('/contracts', {
                templateUrl: 'components/user/views/contracts.html',
                controller: 'UserHomeController',
                controllerAs: 'vm',
                data: {
                    pageTitle: 'Contracts'
                }
            })
            .otherwise('/profile');
    }

    function translateConfig($translateProvider) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'assets/i18n/',
            suffix: '.json'
        });
        $translateProvider.useSanitizeValueStrategy('sanitize');
        $translateProvider.useMissingTranslationHandlerLog();
        $translateProvider.fallbackLanguage('en');
        $translateProvider.use('en');
    }

    function pagetitle($rootScope, $timeout) {
        return {
            link: function (scope, element) {
                var listener = function (event, current) {
                    var pageTitle = 'It\'s You Online';
                    if (current.$$route && current.$$route.data && current.$$route.data.pageTitle) {
                        pageTitle = current.$$route.data.pageTitle + ' - ' + pageTitle;
                    }
                    $timeout(function () {
                        element.text(pageTitle);
                    }, 0, false);
                };

                $rootScope.$on('$routeChangeSuccess', listener);
            }
        };
    }

    function runFunction($route, $cookies, $rootScope, $location) {
        $rootScope.user = $cookies.get('itsyou.online.user');
        var original = $location.path;
        // prevent controller reload when changing route params in code because we aren't using states
        $location.path = function (path, reload) {
            if (reload === false) {
                var lastRoute = $route.current;
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute;
                    un();
                });
            }
            return original.apply($location, [path]);
        };
        if (window.location.hostname === 'dev.itsyou.online') {
            setTimeout(function () {
                window.location.reload();
            }, 9 * 60 * 1000);
        }
        initializePolyfills();
    }

    function initializePolyfills() {
        if (!String.prototype.startsWith) {
            String.prototype.startsWith = function (hashstack, needle) {
                return haystack.lastIndexOf(needle, 0) === 0;
            };
        }
        if (!String.prototype.includes) {
            String.prototype.includes = function (search, start) {
                'use strict';
                if (typeof start !== 'number') {
                    start = 0;
                }

                if (start + search.length > this.length) {
                    return false;
                } else {
                    return this.indexOf(search, start) !== -1;
                }
            };
        }
        if (!Array.prototype.find) {
            Object.defineProperty(Array.prototype, 'find', {
                value: function (predicate) {
                    'use strict';
                    if (this == null) {
                        throw new TypeError('Array.prototype.find called on null or undefined');
                    }
                    if (typeof predicate !== 'function') {
                        throw new TypeError('predicate must be a function');
                    }
                    var list = Object(this);
                    var length = list.length >>> 0;
                    var thisArg = arguments[1];
                    var value;

                    for (var i = 0; i < length; i++) {
                        value = list[i];
                        if (predicate.call(thisArg, value, i, list)) {
                            return value;
                        }
                    }
                    return undefined;
                }
            });
        }
    }
})();
