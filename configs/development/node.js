var port = process.env.WEB_PORT || process.env.PORT || 3100;

module.exports = {
    mongodb: {
        host: '127.0.0.1',
        dbname: 'uautos',
        port: 27017
    },
    web: {
        port: port
    }
};