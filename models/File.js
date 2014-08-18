var FileSchema, FileModel,
    mongoose = require('mongoose'),
    mongooseTimestamp = require('mongoose-timestamp'),
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    filesModule = require(PATHS.LIBS + '/files');

FileSchema = mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // originName: { type: String, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    type: { type: String, trim: true, 'default': '' },
    path: { type: String, trim: true },
    // status: { type: Number, min: 1, max: 5 }, // 1 - Temp File, 2 - Permanent File
    // attachmentToken: { type: String, trim: true, 'default': '' },
    // description: { type: String, trim: true, 'default': '' },
    mime: { type: 'String', default: '' },
    size: { type: Number, min: 0 }
});

FileSchema.plugin(mongooseTimestamp);

FileModel = mongoose.model('Files', FileSchema);

function mockDataGenerator() {
    var users,
        filesPromises = [],
        usersD = Q.defer(),
        d = Q.defer(),
        rc = helpers.randomChance,
        rb = helpers.randomBetween,
        errorStatus = false;

    models.User.find(function(err, result) {
        if (!err) {
            users = result.map(function(item) {
                return item.toJSON({ virtuals: true });
            });
        }
        else {
            log('error', 'Can\'t read users for files generator.', err.toString());
            users = null;
        }

        usersD.resolve();
    });

    usersD.promise.then(function() {
        var basePath = PATHS.UPLOADS + '/mocks',
            types = fs.readdirSync(basePath);

        types.forEach(function(type) {
            var files,
                pathToType = basePath + '/' + type,
                typeStat = fs.statSync(pathToType);

            if (typeStat.isDirectory()) {
                files = fs.readdirSync(pathToType);

                files.forEach(function(fileName) {
                    var fileData,
                        pathToFile = pathToType + '/' + fileName,
                        fileStat = fs.statSync(pathToFile),
                        fileD = Q.defer();

                    fileData = {
                        author: users[rb(0, users.length - 1)].id,
                        name: fileName,
                        type: type,
                        path: '/' + path.relative(PATHS.UPLOADS, pathToFile),
                        mime: 'image/jpg', // fixme
                        size: fileStat.size
                    };

                    filesPromises.push(fileD.promise);

                    models.File.create(fileData, function(err, doc) {
                        if (err) {
                            log('error', 'Error at saving new file.', err.toString());
                            errorStatus = true;
                        }

                        fileD.resolve();
                    });
                });
            }
        });

        Q.allResolved(filesPromises).then(function() {
            if (!errorStatus) {
                log('Files was created.');
            }
            else {
                log('notice', 'Files was created with errors.')
            }

            d.resolve();
        });
    }, function(err) {
        log('error', 'Not enough data for generate files.');
        d.resolve();
    });

    return d.promise;
}

module.exports = {
    name: 'File',
    model: FileModel,
    mock: {
        generator: mockDataGenerator,
        dependencies: 'User'
    }
};