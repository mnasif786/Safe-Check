var MockFactory = MockFactory || {};

MockFactory.createLocalStorageMock = function() {
    var store = {
        getItem: function(key) {
            if (store[key] == undefined) {
                return null;
            }
            return store[key];
        },
        setItem: function(key, value) {
            return store[key] = value + '';
        },
        clear: function() {
            for (var key in store) {
                delete store[key];
            }
        },
        removeItem: function(key) {
            delete store[key];
        }
    };

    return store;
};

MockFactory.createWindowMock = function() {
    return {
        "navigator": { "onLine": true },
        "localStorage": MockFactory.createLocalStorageMock()
    };
};
