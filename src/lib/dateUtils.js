export const MODE_DECADE = 0;
export const MODE_YEAR = 1;
export const MODE_MONTH = 2;

export function compute(currentDate, selectedDate, view, locale, weekStart) {
  // years 4 x 3
  if (view === MODE_DECADE) {
    const nextFrom = 11;
    const prevTo = 1;
    const todayMark = -1;
    const grid = [];
    let yearRow = [];
    let currYear = currentDate.getFullYear() - (currentDate.getFullYear() % 10) - 1;
    for (let i = 0; i < 12; i++) {
      yearRow.push(currYear + i);
      if (yearRow.length === 4) {
        grid.push(yearRow);
        yearRow = [];
      }
    }
    let selectionMark = null;
    if (!selectedDate) {
      selectedDate = new Date();
    }
    if (selectedDate.getFullYear() >= currYear) {
      selectionMark = selectedDate.getFullYear() % currYear;
    }

    return {
      grid, todayMark, nextFrom, prevTo, selectionMark
    }
  }

  // months 4 x 3
  if (view === MODE_YEAR) {
    let grid = [];
    let monthRow = [];
    let prevTo = 12;
    let nextFrom = 24;
    const ISO = currentDate.toISOString().split('T')[0].substring(0, 8);
    const dateNormalized = new Date(ISO + '01 00:00:00');
    const initYear = dateNormalized.getFullYear() - 1;
    dateNormalized.setFullYear(initYear);
    let todayMark = 0;
    for (let y = 0; y < 3; y++) {
      for (let i = 0; i < 12; i++) {
        dateNormalized.setMonth(i);
        monthRow.push(locale.monthsShort[i % 12]);
        if (monthRow.length === 4) {
          grid.push(monthRow);
          monthRow = [];
        }
      }
      dateNormalized.setFullYear(dateNormalized.getFullYear() + 1);
    }
    let selectionMark = null;
    if (!selectedDate) {
      selectedDate = new Date();
    }
    if (selectedDate.getFullYear() - initYear >= 0 && selectedDate.getFullYear() - initYear <= 2) {
      selectionMark = selectedDate.getMonth() + ((selectedDate.getFullYear() - initYear || 0) * 12);
    }
    return {
      grid, todayMark, nextFrom, prevTo, selectionMark
    }
  } 

  // days 7x6
  let d = currentDate || new Date(), // or currently selected date
      y = d.getFullYear(),
      m = d.getMonth(),
      dM = d.getDate(),
      h = d.getHours(),
      today = new Date();
  let prevMonth = new Date(y, m-1, 28, 0, 0, 0, 0),
      day = utils.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
  prevMonth.setDate(day);
  prevMonth.setDate(day - (prevMonth.getDay() - weekStart + 7) % 7);

  let nextMonth = new Date(prevMonth);
  nextMonth.setDate(nextMonth.getDate() + 42);
  let nextMonthValue = nextMonth.valueOf();

  let grid = [];
  let dayRow = [];
  let todayMark = -1;
  let selectionMark = null;
  let prevTo = 0;
  let nextFrom = 42;

  let inc = 0;
  while(prevMonth.valueOf() < nextMonthValue) {
    inc++;
    dayRow.push(new Date(prevMonth));
    if (prevMonth.getFullYear() < y || (prevMonth.getFullYear() === y && prevMonth.getMonth() < m)) {
      prevTo = inc;
    } else if (nextFrom === 42 && (prevMonth.getFullYear() > y || (prevMonth.getFullYear() === y && prevMonth.getMonth() > m))) {
      nextFrom = inc - 1;
    }

    prevMonth.setDate(prevMonth.getDate() + 1);


    if (prevMonth.getFullYear() === today.getFullYear() &&
      prevMonth.getMonth() === today.getMonth() &&
      prevMonth.getDate() === today.getDate()
    ) {
      todayMark = inc;
    }
    if (!selectionMark && selectedDate
      && prevMonth.getFullYear() === selectedDate.getFullYear()
      && prevMonth.getMonth() === selectedDate.getMonth()
      && prevMonth.getDate() === selectedDate.getDate()
    ) {
      selectionMark = inc;
    }
    
    if (dayRow.length === 7) {
      grid.push(dayRow);
      dayRow = [];
    }
  }
  return { grid, todayMark, prevTo, nextFrom, selectionMark };
}

/**
 * 
 * @param {number} newPos 
 * @param {number} view 
 * @returns 
 */
export function moveGrid(newPos, view) {
  if (view === MODE_MONTH) {
    if (newPos < 0) {
      newPos = 42 + newPos;
    }
    return {
      x: newPos % 7,
      y: Math.floor(newPos / 7)
    }
  }
}

const utils = {
  isLeapYear: function (year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
  },
  getDaysInMonth: function (year, month) {
    return [31, (utils.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
  },
}
export function isLower(a, b) {
  if (!(a instanceof Date)) return false;
  return a.getFullYear() < b.getFullYear()
    || (a.getMonth() < b.getMonth() || a.getDate() <= b.getDate());
}

export function isGreater(a, b) {
  if (!(a instanceof Date)) return false;
  return a.getFullYear() > b.getFullYear()
    || (a.getMonth() > b.getMonth() || a.getDate() >= b.getDate());
  
}

/**
 * 
 * @param {Date|string} date 
 * @param {string} format 
 * @param {object} i18n 
 * @param {string} type 
 * @returns 
 */
export function parseDate(date, format, i18n, type) {
  if (date instanceof Date) {
    return date;
    // const dateUTC = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
    // dateUTC.setMilliseconds(0);
    // return dateUTC;
  }
  const commonFormats = type === 'php'
    ? { date: 'Y-m-d', datetime: 'Y-m-d H:i', datetime_s: 'Y-m-d H:i:s' }
    : { date: 'yyyy-mm-dd', datetime: 'yyyy-mm-dd hh:ii', datetime_s: 'yyyy-mm-dd hh:ii:ss' };
  if (/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(date)) {
    format = formatHelper.parseFormat(commonFormats.date, type);
  } else 
  if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}$/.test(date)) {
    format = formatHelper.parseFormat(commonFormats.datetime, type);
  } else 
  if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}\:\d{1,2}[Z]{0,1}$/.test(date)) {
    format = formatHelper.parseFormat(commonFormats.datetime_s, type);
  } else {
    format = formatHelper.parseFormat(format, type);
  }
  const parts = date && date.toString().match(formatHelper.nonpunctuation) || [];
  date = new Date();  // reset date
  date.setHours(0,0,0,0);
  const parsed = {};
  const { setters_order, setters_map } = formatHelper.setters(type);
  let val, part;
  if (parts.length !== format.parts.length && format.parts.includes('S')) { // specific suffix parsing from string like '14th'
    const splitSuffix = parts[format.parts.indexOf('S') - 1].match(/(\d+)([a-zA-Z]+)/).slice(1,3);
    parts.splice(format.parts.indexOf('S') - 1, 1, ...splitSuffix);
  }
  if (parts.length === format.parts.length) {
    for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
      val = parseInt(parts[i], 10);
      part = format.parts[i];
      if (isNaN(val)) {
        if (type === 'standard') {
          switch (part) {
            case 'MM':
              val = i18n.months.indexOf(parts[i]) + 1;
              break;
            case 'M':
              val= i18n.monthsShort.indexOf(parts[i]) + 1;
              break;
            case 'p':
            case 'P':
              val = i18n.meridiem.indexOf(parts[i].toLowerCase());
            break;
          }
        } else {
          // php
          switch (part) {
            case 'D':
              val = i18n.daysShort.indexOf(parts[i]) + 1;
              break;
            case 'l':
              val = i18n.days.indexOf(parts[i]) + 1;
              break;
            case 'F':
              val = i18n.months.indexOf(parts[i]) + 1;
              break;
            case 'M':
              val= i18n.monthsShort.indexOf(parts[i]) + 1;
              break;
            case 'a':
            case 'A':
              val = i18n.meridiem.indexOf(parts[i].toLowerCase());
            break;
          }
        }
      }
      parsed[part] = val;
    }
    for (var i = 0, s; i < setters_order.length; i++) {
      s = setters_order[i];
      if (s in parsed && !isNaN(parsed[s]))
        setters_map[`${s}`] && setters_map[`${s}`](date, parsed[s])
    }
  }
  return date;
}

export function formatDate(date, format, i18n, type) {
  if (date === null) {
    return '';
  }
  const dateVal = date.getDate();
  let val;
  if (type === 'standard') {
    val = {
      t:    date.getTime(),
      // year
      yy:   date.getFullYear().toString().substring(2),
      yyyy: date.getFullYear(),
      // month
      m:    date.getMonth() + 1,
      M:    i18n.monthsShort[date.getMonth()],
      MM:   i18n.months[date.getMonth()],
      // day
      d:    dateVal,
      D:    i18n.daysShort[date.getDay()],
      DD:   i18n.days[date.getDay()],
      S:    (dateVal % 10 && dateVal % 10 <= i18n.suffix.length ? i18n.suffix[dateVal % 10 - 1] : i18n.suffix[i18n.suffix.length -1 ]),
      p:    (i18n.meridiem.length === 2 ? i18n.meridiem[date.getHours() < 12 ? 0 : 1] : ''),
      // hour
      h:    date.getHours(),
      // minute
      i:    date.getMinutes(),
      // second
      s:    date.getUTCSeconds()
    };

    if (i18n.meridiem.length === 2) {
      val.H = (val.h % 12 === 0 ? 12 : val.h % 12);
    }
    else {
      val.H = val.h;
    }
    val.HH = (val.H < 10 ? '0' : '') + val.H;
    val.P = val.p.toUpperCase();
    val.hh = (val.h < 10 ? '0' : '') + val.h;
    val.ii = (val.i < 10 ? '0' : '') + val.i;
    val.ss = (val.s < 10 ? '0' : '') + val.s;
    val.dd = (val.d < 10 ? '0' : '') + val.d;
    val.mm = (val.m < 10 ? '0' : '') + val.m;
  } else if (type === 'php') {
    // php format
    val = {
      // year
      y: date.getFullYear().toString().substring(2),
      Y: date.getFullYear(),
      // month
      F: i18n.months[date.getMonth()],
      M: i18n.monthsShort[date.getMonth()],
      n: date.getMonth() + 1,
      t: utils.getDaysInMonth(date.getFullYear(), date.getMonth()),
      // day
      j: date.getDate(),
      l: i18n.days[date.getDay()],
      D: i18n.daysShort[date.getDay()],
      w: date.getDay(), // 0 -> 6
      N: (date.getDay() === 0 ? 7 : date.getDay()),       // 1 -> 7
      S:    (dateVal % 10 && dateVal % 10 <= i18n.suffix.length ? i18n.suffix[dateVal % 10 - 1] : i18n.suffix[i18n.suffix.length -1 ]),
      // hour
      a: (i18n.meridiem.length === 2 ? i18n.meridiem[date.getHours() < 12 ? 0 : 1] : ''),
      g: (date.getHours() % 12 === 0 ? 12 : date.getHours() % 12),
      G: date.getHours(),
      // minute
      i: date.getMinutes(),
      // second
      s: date.getSeconds(),
      U: Math.floor(date.getTime() / 1000)
    };
    val.m = (val.n < 10 ? '0' : '') + val.n;
    val.d = (val.j < 10 ? '0' : '') + val.j;
    val.A = val.a.toString().toUpperCase();
    val.h = (val.g < 10 ? '0' : '') + val.g;
    val.H = (val.G < 10 ? '0' : '') + val.G;
    val.i = (val.i < 10 ? '0' : '') + val.i;
    val.s = (val.s < 10 ? '0' : '') + val.s;
  } else {
    throw new Error('Invalid format type.');
  }
  let dateArr = [];
  format = formatHelper.parseFormat(format, type);
  for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
    if (format.separators.length) {
      dateArr.push(format.separators.shift());
    }
    dateArr.push(val[format.parts[i]]);
  }
  if (format.separators.length) {
    dateArr.push(format.separators.shift());
  }
  return dateArr.join('');
}

const formatHelper = {
  validParts: function(/** @type {string} */ type) {
    if (type === 'standard') {
      return /t|hh?|HH?|p|P|z|ii?|ss?|dd?|DD?|S|mm?|MM?|yy(?:yy)?/g;
    } else if (type === 'php') {
      return /[dDjlNwzFmMnStyYaABgGhHisU]/g;
    } else {
      throw new Error('Invalid format type.');
    }
  },
  nonpunctuation: /[^ -\/:-@\[-`{-~\t\n\rTZ]+/g,
  parseFormat: function (/** @type {string} */ format, /** @type {string} */ type) {
      // IE treats \0 as a string end in inputs (truncating the value),
      // so it's a bad format delimiter, anyway
    var separators = format.replace(this.validParts(type), '\0').split('\0'),
    parts = format.match(this.validParts(type));
    if (!separators || !separators.length || !parts || parts.length === 0) {
      // throw new Error('Invalid date format.');
      console.warn('invalid date format', separators, parts);
      parts = [];
    }
    return {separators: separators, parts: parts};
  },

  setters: function(type) {
    let setters_order, setters_map;
    if (type === 'standard') {
      setters_order = ['hh', 'h', 'HH', 'H', 'ii', 'i', 'ss', 's','d', 'dd', 'D','DD', 'S', 'm', 'mm', 'M', 'MM', 'yyyy', 'yy', 'p', 'P', 't'];
      setters_map = {
        hh: (d, v) => d.setHours(v),
        h: (d, v) => d.setHours(v),
        HH: (d, v) =>  d.setHours(v === 12 ? 0 : v),
        H: (d, v) => d.setHours(v === 12 ? 0 : v),
        i: (d, v) => d.setMinutes(v),
        s: (d, v) => d.setSeconds(v),
        yyyy: (d, v) => d.setFullYear(v),
        yy: (d, v) => d.setFullYear((v < 50 ? 2000 : 1900)  + v),
        m: (d, v) => {
          v -= 1;
          while (v < 0) v += 12;
          v %= 12;
          d.setMonth(v);
          while (d.getMonth() !== v)
            if (isNaN(d.getMonth()))
              return d;
            else
              d.setDate(d.getDate() - 1);
          return d;
        },
        d: (d, v) => d.setDate(v),
        p: (d, v) => d.setHours(v === 1 ? d.getHours() + 12 : d.getHours()),
        t: (d, v) => d.setTime(v)
      };
      setters_map.mm = setters_map.M = setters_map.MM = setters_map.m;
      setters_map.ii = setters_map.i;
      setters_map.ss = setters_map.s;
      setters_map.dd = setters_map.D = setters_map.DD = setters_map.d;
      setters_map.P = setters_map.p;
    } else {
      // php
      setters_order = ['H','G','h','g','i','s','d','D','j','l','N','S','m','M','F','n','Y','yy','p','P','U'];
      setters_map = {
        H: (d, v) => d.setHours(v),
        G: (d, v) => d.setHours(v),
        h: (d, v) =>  d.setHours(v === 12 ? 0 : v),
        g: (d, v) => d.setHours(v === 12 ? 0 : v),
        i: (d, v) => d.setMinutes(v),
        s: (d, v) => d.setSeconds(v),
        Y: (d, v) => d.setFullYear(v),
        yy: (d, v) => d.setFullYear((v < 50 ? 2000 : 1900)  + v),
        m: (d, v) => {
          v -= 1;
          while (v < 0) v += 12;
          v %= 12;
          d.setMonth(v);
          while (d.getMonth() !== v)
            if (isNaN(d.getMonth()))
              return d;
            else
              d.setDate(d.getDate() - 1);
          return d;
        },
        d: (d, v) => d.setDate(v),
        a: (d, v) => d.setHours(v === 1 ? d.getHours() + 12 : d.getHours()),
        U: (d, v) => d.setTime(v * 1000)
      };
      setters_map.F = setters_map.M = setters_map.m;
      setters_map.D = setters_map.j = setters_map.l = setters_map.N = setters_map.d;
      setters_map.A = setters_map.a;
    }
    return { setters_order, setters_map };
  }
}