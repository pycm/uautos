var UserSchema, UserModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamp'),
    crypto = require('crypto');

// defaults
// validations
// unique

UserSchema = mongoose.Schema({
    disabled: { type: Boolean, 'default': false },
    // status: { type: Number, required: true },
    gid: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup', required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String },
    name: { type: String, 'default': '' },
    phone: { type: String }
    // location: null,
    // settings: null
    // timezone: null
});

UserSchema.plugin(timestamps);

UserModel = mongoose.model('User', UserSchema);

UserSchema.pre('save', function(next) {
    var user = this,
        clearPassword = user.password;

    if (user.isModified('password')) {
        try {
            user.salt = crypto.randomBytes(128).toString('base64');
            user.password = crypto.createHash('md5').update(user.salt + clearPassword).digest('hex');

            next();
        }
        catch (err) {
            next(err);
        }
    }
    else {
        next();
    }
});

UserSchema.methods.verifyPassword = function(password) {
    var validHash = crypto.createHash('md5').update(this.salt + password).digest('hex');

    return this.password === validHash;
};

function mockDataGenerator() {
    var usersList, userGroups,
        d = Q.defer(), userGroupsD = Q.defer(),
        usersDefers = [],
        rc = helpers.randomChance,
        rb = helpers.randomBetween,
        errorStatus = false;

    try{
        usersList = fs.readFileSync(PATHS.MODELS + '/mocks/users.txt', 'utf-8').split(os.EOL).filter(function(line){
            return !!line;
        })
    }
    catch (err) {
        log('Can\'t read file with users.', err.toString());

        usersList = [];
        errorStatus = true;
    }

    models.UserGroup.find(function(err, result) {
        if (!err) {
            userGroups = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });
        } else {
            log('error', 'Can\'t get user groups for users generator.', err.toString());
            userGroups = null;
        }

        userGroupsD.resolve();
    });

    userGroupsD.promise.then(function() {
        if (userGroups && userGroups.length) {
            usersList.forEach(function(userData) {
                var userD = Q.defer(),
                    userParts = userData.split('|');

                usersDefers.push(userD.promise);

                models.User.create({
                    disabled: rc(33),
                    gid: userGroups[rb(0, userGroups.length - 1)].id,
                    email: userParts[0],
                    password: userParts[1],
                    name: userParts[2],
                    phone: userParts[3]
                }, function(err, doc) {
                    if (err) {
                        log('error', err.toString());
                        errorStatus = true;
                    }

                    userD.resolve();
                });
            });

            Q.allResolved(usersDefers).then(function() {
                if (errorStatus) {
                    log('notice', 'Users was created with errors.');
                } else {
                    log('Users was added.');
                }

                d.resolve();
            }).done();
        }
        else {
            log('error', 'Not enougth data for generate users.');
            d.resolve();
        }
    });

    return d.promise;
}

module.exports = {
    name: 'User',
    model: UserModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: ['UserGroup']
    }
};