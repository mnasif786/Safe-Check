describe('Add Bespoke Question Controller tests', function () {

    var $rootScope;
    var $modalInstance;

    var category;

    beforeEach(function () {
        module('ui.bootstrap');
    });

    beforeEach(inject(function ($injector) {
        // Get hold of a scope (i.e. the root scope)
        $rootScope = $injector.get('$rootScope');
        $modalInstance = {
            "close": function () { }
        };

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');

        $rootScope.Checklist = {
            "Questions": [],
            "id": 123
        };

        category = {
            "Id": "123",
            "Title": "Category title",
            "Name": "Category Name"
        };

        var orderNumber = 0;
        createController = function () {
            return $controller('AddBespokeQuestionController', { '$scope': $rootScope, '$modalInstance': $modalInstance, 'category': category, 'orderNumber': orderNumber, 'clientId' : 1234 });
        };
    }));

    it('given you create a bespoke question, then it is added to list of checklist questions', function () {
        var target = createController();
        $rootScope.ok();

        //then
        expect($rootScope.newQuestion).toBeDefined();
        expect($rootScope.newQuestion).toNotBe(null);
        expect($rootScope.newQuestion.Question.Category).toNotBe(null);
        expect($rootScope.newQuestion.Question.Category.Id).toEqual(category.Id);

    });
});
