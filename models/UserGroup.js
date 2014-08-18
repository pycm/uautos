var UserGroupSchema, UserGroupModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose');

// defaults
// validations
// unique

UserGroupSchema = mongoose.Schema({
    key: { type: String, required: true },
    description: { type: String, required: true }
    // permissions: []
});

UserGroupModel = mongoose.model('UserGroup', UserGroupSchema);

function mockDataGenerator() {
    var userGroupsList,
        d = Q.defer(),
        userGroupsDefers = [],
        errorStatus = false;

    try{
        userGroupsList = fs.readFileSync(PATHS.MODELS + '/mocks/userGroups.txt', 'utf-8').split(os.EOL).filter(function(line){
            return !!line;
        })
    }
    catch (err) {
        log('Can\'t read file with user groups.', err.toString());

        userGroupsList = [];
        errorStatus = true;
    }

    userGroupsList.forEach(function(userGroupData) {
        var userGroupD = Q.defer(),
            userGroupParts = userGroupData.split('|');

        userGroupsDefers.push(userGroupD.promise);

        models.UserGroup.create({
            key: userGroupParts[0],
            description: userGroupParts[1]
        }, function(err, doc) {
            if (err) {
                log('error', err.toString());
                errorStatus = true;
            }

            userGroupD.resolve();
        });
    });

    Q.allResolved(userGroupsDefers).then(function() {
        if (errorStatus) {
            log('notice', 'User groups was created with errors.');
        } else {
            log('User groups was added.');
        }

        d.resolve();
    }).done();

    return d.promise;
}

module.exports = {
    name: 'UserGroup',
    model: UserGroupModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: []
    }
};