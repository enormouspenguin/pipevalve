#!/usr/bin/env node
var stream = require("stream")
    , util = require("util");


var Transform = stream.Transform;

module.exports = PipeValve;

/**
 * Notices:
 *  + This implement use internal variable in 'Transform' stream of native node.js library to minimize redundant,
 *  unnecessary caching and maximize performance. So if you encounter error when upgrading node.js, fix it
 *  either by reading new native code and adjust this code accordingly or implement self caching capability.
 *  The internal variable is named 'this._transformState' and it's of internal class 'TransformState'.
*/
/**
 *@constructor
*/
function PipeValve(options) {
    if (!(this instanceof PipeValve))
        return new PipeValve(options);
    
    options = options || {};
    Transform.call(this, options);
    
    var valve = this;
    
    //State vars:
    valve._flowing = false;
    /*valve._remaining = false;*/
    valve._delayed = null;
    
    //Monitor vars:
    valve._passedCount = 0;
    
    //Time vars:
    valve._creationTime = new Date();
    valve._firstChunkTime = null;
    valve._lastChunkTime = null;
    
    //Limit vars:
    valve._maxThroughput = options.maxThroughput;
    valve._maxPassedCount = options.maxPassedCount;
    
    //Pre-bind 'turnOn()' function and 'this' to re-use it multiple times later without using closure or re-binding.
    valve._bindedTurnOn = turnOnThisValve.bind(valve);
    
/**
 * TODO: setup cleaning up process.
*/
}

util.inherits(PipeValve, Transform);

PipeValve.prototype._transform = firstTransform;

PipeValve.prototype._count = count;

PipeValve.prototype.turnOn = function () {
    this._cancelDelay();
    if (this._flowing === false) {
        this._flowing = true;
        var ts = this._transformState;
        if (ts.transforming /*this._remaining*/) {
            pump(this, ts.writechunk, ts.writeencoding, ts.afterTransform);
        }
    }
};

PipeValve.prototype.turnOff = function () {
    this._cancelDelay();
    if (this._flowing) {
        this._flowing = false;
    }
};

/**
 * This function only cancel the delay made before but not turn it back on
*/
PipeValve.prototype._cancelDelay = function() {
    clearTimeout(this._delayed);
    this._delayed = null;
};

PipeValve.prototype.delay = function(ms) {
    this._cancelDelay();//In case 'delay()' get called multiple times in a row.
    this.turnOff();
    setTimeout(this._bindedTurnOn, ms);
};

PipeValve.prototype.isDelayed = function() {
    return !!this._delayed;
};

/**
 * TODO:
*/
PipeValve.prototype.monitorOn = function() {
    throw new Error('not implemented');
};

/**
 * TODO:
*/
PipeValve.prototype.monitorOff = function() {
    throw new Error('not implemented');
};

/**Can't use unit here because PipeValve relax of how to count things that pass through. So it don't know what
 * is being count or the unit of those. You can only choose the interval between calculation like per second,
 * or minute but neither megabits nor gigabytes.
*/
/**
 * TODO:
*/
PipeValve.prototype.throttle = function(max/*, unit*/) {
    throw new Error('not implemented');
};





function pump(stream, chunk, encoding, done) {
    stream.push(chunk, encoding);
    /*stream._remaining = false;*/
    this._passedCount += stream._count(chunk, encoding);
    stream._lastChunkTime = new Date();
    done();
}

function firstTransform(chunk, encoding, done) {
    this._firstChunkTime = new Date();
    this._transform = nextTransform;
    this._transform(chunk, encoding, done);
}

function nextTransform(chunk, encoding, done) {
    if (this._flowing) {
        pump(this, chunk, encoding, done);
    } else {
        this._remaining = true;
    }
}

function turnOnThisValve() {
    this.turnOn();
};

function count(chunk, encoding) {
    return chunk ? (chunk.length || 1) : 0;
}

//use this function to do cleaning up process after this PipeValve has been used
function cleanUp() {

}