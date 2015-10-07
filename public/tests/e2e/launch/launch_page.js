var LaunchPage = function() {

    this.launchItemsList = element(by.id('launch_items_list'));
    this.addNewLaunchLink = element(by.id('add_new_launch_item'));
    this.launchItemEdit = element(by.id('launch-item-edit-button'));
    this.launchItemSave = element(by.id('launch-item-save-button'));
    this.launchItemDelete  = element(by.id('launch-item-delete-button'));

    this.addNewLaunchSubmit = element(by.id('add-launch-submit-button'));
    this.deployRadioButton = element(by.id('typeDeploy'));
    this.regularRadioButton = element(by.id('typeRegular'));
    this.conclusiveRadioButton = element(by.id('typeConclusive'));
    this.launchItemNameInput = element(by.model('launchItem.name'));
    this.launchItemCommandInput = element(by.model('launchItem.command'));
    this.launchItemTimeoutInput = element(by.model('launchItem.timeout'));

    this.editLaunchItemName = element(by.model('launchItem.name'));
    this.editLaunchItemCommand = element(by.model('launchItem.command'));
    this.editLaunchItemTimeout = element(by.model('launchItem.timeout'));
    this.editLaunchItemSaveButton = element(by.id(''));
};

module.exports = new LaunchPage();
