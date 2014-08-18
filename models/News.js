var NewsSchema, NewsModel,
    fs = require('fs'),
    os = require('os'),
    mongoose = require('mongoose'),
    timestamps = require('mongoose-timestamp');

// defaults
// validations
// unique

NewsSchema = mongoose.Schema({
    disabled: { type: Boolean, 'default': false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true }
    // files
});

NewsSchema.plugin(timestamps);

NewsModel = mongoose.model('News', NewsSchema);

function mockDataGenerator() {

}

module.exports = {
    name: 'News',
    model: NewsModel,
    mock: null && {
        generator: mockDataGenerator,
        dependencies: []
    }
};