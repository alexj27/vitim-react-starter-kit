var ws = require("nodejs-websocket");
var _ = require("lodash");

/**
 * Action "succeeded" type creator
 * @param  {string} type - action type
 * @return {string} new action type
 */
function succeeded(type) {
    return type + '_REQUEST_SUCCESS';
}

/**
 * Action "failed" type creator
 * @param  {string} type - action type
 * @return {string} new action type
 */
function failed(type) {
    return type + '_REQUEST_FAILURE';
}

const SIG_REGISTRATION = 'SIG_REGISTRATION';
const SIG_CALL = 'SIG_CALL';
const SIG_EXCHANGE = 'SIG_EXCHANGE';
const SIG_CALL_OFFER = 'SIG_CALL_OFFER';
const SIG_USER_REGISTERED = 'SIG_USER_REGISTERED';
const SIG_USER_DISCONNECTED = 'SIG_USER_DISCONNECTED';
const SIG_SET_REGISTERED_USERS = 'SIG_SET_REGISTERED_USERS';
const SIG_CALL_ACCEPTED = 'SIG_CALL_ACCEPTED';
const SIG_CALL_REJECTED = 'SIG_CALL_REJECTED';
const SIG_HUNG_UP = 'SIG_HUNG_UP';


function s(obj) {
    return JSON.stringify(obj);
}

function p(json) {
    return JSON.parse(json);
}

const connections = {};


function disconnectUser(userId) {
    const user = connections[userId];
    if (!user) {
        return null;
    }
    delete connections[userId];

    _.forEach(connections, function (connection) {
        connection.send(s({ type: SIG_USER_DISCONNECTED, userId: userId }));
    })
}


function registrationsNotify(userId) {
    _.forEach(connections, function (connection, id) {
        console.log("Notify user", id);
        if (id !== userId) {
            connection.send(s({ type: SIG_USER_REGISTERED, userId: userId }));
        }
    })
}

function initConnection(conn) {
    console.log("New connection");
    var userId;

    conn.on("text", function (json) {
        console.log("Received ", json);
        const request = p(json);

        switch (request.type) {
            case SIG_REGISTRATION: {
                userId = request.selfId.toString();
                conn.sendText(s({ type: succeeded(SIG_REGISTRATION) }));
                conn.sendText(s({ type: SIG_SET_REGISTERED_USERS, users: Object.keys(connections).filter(function(id){ return (id.toString() !== userId.toString()) }) }));

                connections[request.selfId] = conn;
                registrationsNotify(request.selfId);
                break;
            }
            case SIG_SET_REGISTERED_USERS: {
                conn.sendText(s({ type: SIG_SET_REGISTERED_USERS, users: Object.keys(connections).filter(function(id){ return (id.toString() !== userId.toString()) }) }));
                console.log(s({ type: SIG_SET_REGISTERED_USERS, users: Object.keys(connections).filter(function(id){ return (id.toString() !== userId.toString()) }) }));
                break;
            }
            case SIG_CALL: {
                if (connections[request.userId]) {
                    connections[request.userId].sendText(s({ type: SIG_CALL_OFFER, userId: userId }));
                } else {
                    conn.sendText(s({ type: failed(SIG_CALL), userId: request.userId, reason: 'not_registered' }));
                }
                break;
            }
            case SIG_CALL_ACCEPTED: {
                connections[request.userId].sendText(s({
                    type: succeeded(SIG_CALL),
                    to: request.userId,
                    from: userId
                }));
                break;
            }
            case SIG_CALL_REJECTED: {
                if (request.userId && connections[request.userId]) {
                    connections[request.userId].sendText(s({
                        type: failed(SIG_CALL),
                        reason: 'rejected',
                        from: userId
                    }));
                } else {
                    conn.sendText(s({
                        type: failed(SIG_CALL_REJECTED),
                        reason: 'user_unavailable'
                    }));
                }
                break;
            }
            case SIG_HUNG_UP: {
                if (request.to && connections[request.to]) {
                    connections[request.to].sendText(s(request));
                } else {
                    conn.sendText(s({
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
                    connections[request.to].sendText(s(request));
                } else {
                    conn.sendText(s({
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

    conn.on("error", function (errObj) {
        console.log('Error', errObj);
        disconnectUser(userId);
    });

    conn.on("close", function (code, reason) {
        const user = disconnectUser(userId);
        console.log("Connection closed", userId, code, reason, user && user.userId);
    });
}


ws.createServer(initConnection).listen(8001);
