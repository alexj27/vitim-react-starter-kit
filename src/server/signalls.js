/* eslint-disable */
const fs = require('fs');
const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const _ = require('lodash');

/**
 * Action 'succeeded' type creator
 * @param  {string} type - action type
 * @return {string} new action type
 */
function succeeded(type) {
    return type + '_REQUEST_SUCCESS';
}

/**
 * Action 'failed' type creator
 * @param  {string} type - action type
 * @return {string} new action type
 */
function failed(type) {
    return type + '_REQUEST_FAILURE';
}

const SIG_REGISTRATION = 'SIG_REGISTRATION';
const SIG_LOGOUT = 'SIG_LOGOUT';
const SIG_CALL = 'SIG_CALL';
const SIG_EXCHANGE = 'SIG_EXCHANGE';
const SIG_CALL_OFFER = 'SIG_CALL_OFFER';
const SIG_USER_REGISTERED = 'SIG_USER_REGISTERED';
const SIG_USER_DISCONNECTED = 'SIG_USER_DISCONNECTED';
const SIG_SET_REGISTERED_USERS = 'SIG_SET_REGISTERED_USERS';
const SIG_CALL_ACCEPTED = 'SIG_CALL_ACCEPTED';
const SIG_CALL_REJECTED = 'SIG_CALL_REJECTED';
const SIG_HUNG_UP = 'SIG_HUNG_UP';
const SIG_USERS_BUSY = 'SIG_USERS_BUSY';
const SIG_USERS_FREE = 'SIG_USERS_FREE';


function s(obj) {
    return JSON.stringify(obj);
}

function p(json) {
    return JSON.parse(json);
}

const connections = {};
const activeCalls = {};
const patients = {};
const doctors = {};


function disconnectUser(userId) {
    const user = connections[userId];
    if (!user) {
        return;
    }
    delete connections[userId];
    delete activeCalls[userId];

    _.forEach(connections, function (connection) {
        connection.send(s({ type: SIG_USER_DISCONNECTED, userId: userId }));
    });
}


function registrationsNotify(userId) {
    _.forEach(connections, function (connection, id) {
        if (id !== userId) {
            connection.send(s({ type: SIG_USER_REGISTERED, userId: userId }));
        }
    });
}


function setActiveCall(from, to) {
    activeCalls[from] = true;
    activeCalls[to] = true;

    _.forEach(connections, function (connection, id) {
        if (id !== from) {
            connection.send(s({ type: SIG_USERS_BUSY, users: [from, to].filter(id => id) }));
        }
    });
}

function removeActiveCall(from, to) {
    activeCalls[from] = false;
    activeCalls[to] = false;

    _.forEach(connections, function (connection, id) {
        if (id !== from) {
            connection.send(s({ type: SIG_USERS_FREE, users: [from, to].filter(id => id) }));
        }
    });
}

function isActiveCall(from, to) {
    return activeCalls[from] || activeCalls[to];
}


function initConnection(conn) {
    console.log('New connection');
    var userId;

    conn.on('message', function (json) {
        console.log('Received ', json);
        const request = p(json);

        switch (request.type) {
            case SIG_REGISTRATION: {
                userId = request.selfId;
                // if (connections[userId]) {
                //     conn.send(s({ type: failed(SIG_REGISTRATION), reason: 'Another user use this account' }));
                //     break;
                // }

                conn.send(s({ type: succeeded(SIG_REGISTRATION) }));
                conn.send(s({
                    type: SIG_SET_REGISTERED_USERS, users: Object.keys(connections).filter(function (id) {
                        return (id.toString() !== userId.toString())
                    })
                }));

                connections[request.selfId] = conn;
                registrationsNotify(request.selfId);
                break;
            }
            case SIG_LOGOUT: {
                userId = request.selfId;
                if (!connections[userId]) {
                    conn.send(s({ type: failed(SIG_REGISTRATION), reason: 'logaut' }));
                    break;
                }

                disconnectUser(userId);
                break;
            }
            case SIG_CALL: {
                if (isActiveCall(userId, request.userId)) {
                    conn.send(s({ type: failed(SIG_CALL), userId: request.userId, reason: 'busy' }));
                } else if (connections[request.userId]) {
                    setActiveCall(userId, request.userId);
                    connections[request.userId].send(s({ type: SIG_CALL_OFFER, userId: userId }));
                } else {
                    conn.send(s({ type: failed(SIG_CALL), userId: request.userId, reason: 'not_registered' }));
                }
                break;
            }
            case SIG_CALL_ACCEPTED: {
                connections[request.userId].send(s({
                    type: succeeded(SIG_CALL),
                    to: request.userId,
                    from: userId
                }));
                break;
            }
            case SIG_CALL_REJECTED: {
                removeActiveCall(userId, request.userId);

                if (request.userId && connections[request.userId]) {
                    connections[request.userId].send(s({
                        type: failed(SIG_CALL),
                        reason: 'rejected',
                        from: userId
                    }));
                } else {
                    conn.send(s({
                        type: failed(SIG_CALL_REJECTED),
                        reason: 'user_unavailable'
                    }));
                }
                break;
            }
            case SIG_HUNG_UP: {
                removeActiveCall(userId, request.to);

                if (request.to && connections[request.to]) {
                    connections[request.to].send(s(request));
                } else {
                    conn.send(s({
                        type: failed(SIG_HUNG_UP),
                        reason: 'user_unavailable'
                    }));
                }
                break;
            }
            case SIG_EXCHANGE: {
                if (request.to && connections[request.to]) {
                    console.log('Exchange', request);
                    request.from = userId;
                    connections[request.to].send(s(request));
                } else {
                    conn.send(s({
                        type: failed(SIG_EXCHANGE),
                        userId: request.userId,
                        reason: 'user_unavailable'
                    }));
                }
                break;
            }
            default:
        }
    });

    conn.on('error', function (errObj) {
        console.log('Error', errObj);
        disconnectUser(userId);
    });

    conn.on('close', function (code, reason) {
        const user = disconnectUser(userId);
        console.log('Connection closed', userId, code, reason, user && user.userId);
    });
}


const processRequest = function (req, res) {
    res.writeHead(200);
    res.end('All glory to WebSockets!\n');
};


const cfg = {
    ssl: true,
    port: 8443,
    ssl_key: '/etc/nginx/ssl/vit.im.key',
    ssl_cert: '/etc/nginx/ssl/vit.im.crt',
};


const app = https.createServer({
    key: fs.readFileSync(cfg.ssl_key),
    cert: fs.readFileSync(cfg.ssl_cert)

}, processRequest).listen(cfg.port, "0.0.0.0", function () {
    console.log('Server secure is up');
});


const appHttp = http.createServer(processRequest).listen(8002, "0.0.0.0", function () {
    console.log('Server local is up');
});


const wss = new WebSocket.Server({ server: app });
const wssLocal = new WebSocket.Server({ server: appHttp });


wss.on('connection', initConnection);
wssLocal.on('connection', initConnection);
