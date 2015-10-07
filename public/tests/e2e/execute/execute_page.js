var ExecutePage = function() {

    this.envKey = element(by.model('item.key'));
    this.envValue = element(by.model('item.value'));
};

module.exports = new ExecutePage();
