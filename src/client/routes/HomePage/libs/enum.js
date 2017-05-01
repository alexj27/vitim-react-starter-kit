const enumeration = {};


enumeration.states = Object.freeze({
    new: {
        requesting: 1,
        recovering: 1,
        ringing: 1,
        destroy: 1,
        answering: 1,
        hangup: 1
    },
    requesting: {
        trying: 1,
        hangup: 1,
        active: 1
    },
    recovering: {
        answering: 1,
        hangup: 1
    },
    trying: {
        active: 1,
        early: 1,
        hangup: 1
    },
    ringing: {
        answering: 1,
        hangup: 1
    },
    answering: {
        active: 1,
        hangup: 1
    },
    active: {
        answering: 1,
        requesting: 1,
        hangup: 1,
        held: 1
    },
    held: {
        hangup: 1,
        active: 1
    },
    early: {
        hangup: 1,
        active: 1
    },
    hangup: {
        destroy: 1
    },
    destroy: {},
    purge: {
        destroy: 1
    }
});


function ENUM(s) {
    const o = {};
    s.split(' ').forEach((x, val) => {
        o[x] = {
            name: x,
            val
        };
    });
    return Object.freeze(o);
}


enumeration.state = ENUM('new requesting trying recovering ringing answering early active held hangup destroy purge');
enumeration.direction = ENUM('inbound outbound');
enumeration.message = ENUM('display info pvtEvent');


export default enumeration;
