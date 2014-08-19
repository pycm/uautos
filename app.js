var ENV = process.env.NODE_ENV || 'development',
    cluster = require('cluster');

switch (ENV) {
    case 'development':
        console.log('Application run in development environment (single thread).');
        runSingleThread();

        break;
    case 'production':
        if (cluster.isMaster) {
            console.log('Application run in production environment (multi threads).');
        }
        runMultiThreads();

        break;
    default:
        console.error('Wrong ENV.');
}

function runSingleThread() {
    require('local/init.js');
}

/*
    TODO: run workers after death
    TODO: add new features from 0.8.x / 0.10.x
 */
function runMultiThreads() {
    var i, pid,
        numCPUs = require('os').cpus().length,
        rssWarn = (250 * 1024 * 1024),
        heapWarn = (250 * 1024 * 1024),
        workers = {};

    if (cluster.isMaster) {
        for (i = 0; i < numCPUs; i++) {
            createWorker();
        }

        setInterval(function() {
            var time = new Date().getTime();

            for (pid in workers) {
                if (workers.hasOwnProperty(pid) && workers[pid].lastCb + 5000 < time) {
                    console.error('Long running worker ' + pid + ' killed.');

                    workers[pid].worker.destroy();
                    delete(workers[pid]);
                    createWorker();
                }
            }
        }, 1000);

    }
    else {
        runSingleThread();

        setInterval(function report() {
            process.send({
                cmd: 'reportMem',
                memory: process.memoryUsage(),
                process: process.pid
            });
        }, 1000);
    }

    function createWorker() {
        var worker = cluster.fork().process;

        console.log('Created worker: ' + worker.pid + '.');

        workers[worker.pid] = {
            worker: worker,
            lastCb: new Date().getTime() - 1000
        };

        worker.on('message', function(m) {
            if (m.cmd === 'reportMem') {
                workers[m.process].lastCb = new Date().getTime();

                if (m.memory.rss > rssWarn) {
                    console.log('Worker ' + m.process + ' using too much memory.');
                }
            }
        });
    }
}