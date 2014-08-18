var Q = require('q');

module.exports = {

    name: 'Controller',

    isAbstract: true,

    init: function() {},

    middlewares: function(req) {
        var result = ['cookie', 'session', 'passport', 'env'];

        if (['POST', 'PUT', 'PATCH'].indexOf(req.method) !== -1) {
            result.push('body');
            result.push('validator');
        }

        return result;
    },

    flow: [
        {
            name: 'env',
            params: ['req', 'res'],
            type: 'add'
        },
        {
            name: 'validate',
            params: ['stor', 'env'],
            type: 'add'
        },
        {
            name: 'model',
            params: ['stor', 'env'],
            type: 'add'
        },
        {
            name: 'view',
            params: ['stor', 'env'],
            type: 'replace'
            // required: true // route should have his own method
        },
        {
            name: 'end',
            params: ['req', 'res'],
            type: 'replace'
        }
    ],

    // type add + required true = error

    mapping: function() {
        /*
            return { // todo: [4]
                main: {
                    path: '/',
                    priority: 1, // default 0
                    type: 'POST' || ['GET', 'POST'],
                    middlewares: function || text
                    env flow // stor.*
                    validate flow // validate
                    model flow // stor.data
                    view flow // stor.output || stor.html || stor.json || stor.txt
                    end flow // end
                    error flow // error
                }
            } || null
         */
    },

    exec: function(route, req, res, next) {
        var self = this,
            flow = this.flow,
            flowLength = flow.length,
            stor = this.buildStor(req),
            flowAsync = Q.resolve();

        flow.forEach(function(step, ind) {
            var isLast = ind === flowLength - 1;

            flowAsync = flowAsync.then(function() {
                return self.stepHelper.call(self, step, route, stor, req, res);
            });
        });

        flowAsync.fail(function(err) {
            var routeError = route.error,
                ctrlError = self.error,
                errorHandler = routeError || ctrlError || null;

            if (errorHandler) {
                if (typeof errorHandler === 'string') errorHandler = self[errorHandler];

                errorHandler.call(self, err, req, res);
            }
            else {
                next(err);
            }
        }).done();

        // todo: [5]
    },

    buildStor: function(req) {
        var stor = req.stor = {};

        stor.headers = {};

        return stor;
    },

    stepHelper: function(step, route, stor, req, res) {
        var result, method,
            self = this,
            ctrlMethod = this[step.name],
            routeMethod = route[step.name],
            paramName2Obj = { step: step, route: route, stor: stor, req: req, res: res, env: req.env },
            params = [];

        if (step.params) {
            step.params.forEach(function(paramName) {
                params.push(paramName2Obj.hasOwnProperty(paramName) ? paramName2Obj[paramName] : null);
            });
        }

        if (typeof ctrlMethod === 'string') ctrlMethod = this[ctrlMethod];
        if (typeof routeMethod === 'string') routeMethod = this[routeMethod];

        if (step.type === 'add') {
            result = Q.resolve().then(function() {
                return ctrlMethod ? ctrlMethod.apply(self, params) : Q.resolve();
            }).then(function() {
                return routeMethod ? routeMethod.apply(self, params) : Q.resolve();
            });
        }
        else if (step.type === 'replace') {
            method = routeMethod ? routeMethod : (ctrlMethod ? ctrlMethod : null);

            if (method) {
                result = method.apply(this, params);
            }
            else {
                if (step.required) throw new Error(step.name.charAt(0).toUpperCase() + step.name.slice(1) + ' step is required.');
                else result = Q.resolve();
            }
        }
        else {
            throw new Error('Unexpected step type.');
        }

        return result;
    },

    end: function(req, res) {
        var stor = req.stor,
            status = stor.status || 200,
            headers = stor.headers || {},
            output = stor.output || '';

        if (!headers['Content-Length']) headers['Content-Length'] = Buffer.byteLength(output, 'utf-8');

        Object.keys(headers).forEach(function(headerName) {
            res.setHeader(headerName, headers[headerName]);
        });

        res.writeHead(status);
        res.end(output);
    }

};
