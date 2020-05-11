
function getCurrentTime () {
    const date = new Date
    const YYYY = date.getFullYear()
    const MM = coverEachUnit(date.getMonth() + 1)
    const DD = coverEachUnit(date.getDate())
    const HH = coverEachUnit(date.getHours())
    const mm = coverEachUnit(date.getMinutes())
    const ss = coverEachUnit(date.getSeconds())
    return `${YYYY}-${MM}-${DD}_${HH}:${mm}:${ss}`
}
  
function coverEachUnit (val) {
    return val < 10 ? '0' + val : val
}

module.exports = {
    getCurrentTime
} 