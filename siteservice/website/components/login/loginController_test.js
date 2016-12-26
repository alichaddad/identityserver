describe('Login Controller test', function() {

    beforeEach(module('loginApp'));

    var scope;

    beforeEach(inject(function ($http, $window, $rootScope, $interval, LoginService, $controller) {

        scope = $rootScope.$new();

        loginController = $controller('loginController', {
          $http: $http,
          $window: $window,
          $scope: scope,
          $rootScope: $rootScope,
          $interval: $interval,
          LoginService: LoginService
        });
    }));

    it('loginController should be defined', function() {
        expect(loginController).toBeDefined();
    });
});
