function findFreeIntervals(pIntervals) {
    // Intervals is array of busy intervals

    if (!pIntervals) {
        return "Select at least one user to see suggested times";
    }

    if (pIntervals.length == 0) {
        console.log('All available');
        return "All available!";
    }

    let now = new Date();
    let maxEnd = new Date();
    maxEnd.setDate(now.getDate() + 14); // 2 weeks from now

    console.log('now is');
    console.log(now);
    console.log('maxEnd is');
    console.log(maxEnd);
    // let now = 0;
    // let maxEnd = 100;

    let intervals = [];

    // Only consider intervals in range
    for (var interval of pIntervals) {
        if (interval[0] >= now && interval[1] <= maxEnd) {
            intervals.push(interval);
        }
    }

    console.log('intervals in range are');
    console.log(intervals);

    if (intervals.length == 0) {
        console.log('All available');
        return "All available!";
    }

    // Sort by start time
    intervals = intervals.sort((a, b) => {
        if (a[0] == b[0]) {
            return a[1] < b[1];
        } else {
            return a[0] > b[0];
        }
    })

    console.log('Intervals are');
    console.log(intervals);

    // Merge intervals
    let mergedIntervals = [];
    
    for (var interval of intervals) {
        if (mergedIntervals.length == 0) {
            mergedIntervals.push(interval);

        } else {
            let lastInterval = mergedIntervals[mergedIntervals.length - 1];
            console.log('lastInterval is');
            console.log(lastInterval);
            // If overlapping, merge
            if (interval[0] <= lastInterval[1]) {
                console.log('max is')
                mergedIntervals[mergedIntervals.length - 1][1] = Math.max.apply(null, [lastInterval[1], interval[1]]);
            } else {
                mergedIntervals.push(interval);
            }
        }
        
    }

    console.log('Merged busy intervals are');
    console.log(mergedIntervals);

    // Find the gaps between disjoint intervals
    let freeIntervals = [];

    if (now < mergedIntervals[0][0]) {
        freeIntervals.push([now, mergedIntervals[0][0]])
    }

    for (var idx = 1; idx < mergedIntervals.length; idx++) {
        freeIntervals.push([mergedIntervals[idx - 1][1], mergedIntervals[idx][0]]);
    }

    if (maxEnd > mergedIntervals[mergedIntervals.length - 1][1]) {
        freeIntervals.push([mergedIntervals[mergedIntervals.length - 1][1], maxEnd])
    }
    
    if (freeIntervals.length == 0) {
        return "No free time among all selected people!";
    }

    console.log('Free intervals are');
    console.log(freeIntervals);
    console.log('\n\n')

    return freeIntervals;
}

module.exports = findFreeIntervals;