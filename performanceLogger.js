class performanceLogger {
    constructor(nodeid) {
        this.nodeid = nodeid;
        this.startTime = new Date();
        this.timers = {};
        this.performance = { nodeid: nodeid, startTime: new Date() };
    }
    start(name) {
        this.timers[name] = { hrtime: process.hrtime(), startTime: new Date() };
        return this;//for chaining
    }
    end(name) {
        try {
            var endTime = process.hrtime(this.timers[name].hrtime);
            this.performance[name] = {
                startTime: this.timers[name].startTime,
                seconds: endTime[0],
                milliseconds: endTime[1] / 1000000.0
            };
            return this;//for chaining
        }
        catch (error) {
        }
    }
    getPerformance(name) {
        if (name) {
            return this.performance[name];
        }
        return this.performance;
    }
}

module.exports = performanceLogger;