(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.EthiopianDate = factory());
})(this, (function () { 'use strict';

    const amPM = {
      am: 'ጥዋት',
      pm: 'ከሰዓት'
    };
    const dayNames = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];
    const monthNames = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
    const era = 'ዓ/ም';

    const ET_EPOCH = 2796; // 2796 in the Ethiopian calendar is the first day of the first month of year 1 AD in the Gregorian calendar

    const GREGORIAN_EPOCH = 1721425.5; // Julian day number of Gregorian epoch: 0001-01-01

    const ETHIOPIC_EPOCH = 2796; // Julian day number of Ethiopic epoch: 0001-01-01

    const JD_EPOCH_OFFSET = 1723856; // Julian day number of Ethiopic epoch, relative to Gregorian

    const nMonths = 12;

    const monthDays = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360];

    const isLeap = year => year % 4 === 3;

    const toGregorian = (year, month, day) => {
      if (year === undefined || month === undefined || day === undefined) {
        const today = new Date();
        return toGregorian(today.getFullYear(), today.getMonth() + 1, today.getDate());
      }

      const era = Math.floor(year / 100);
      const jdn = JD_EPOCH_OFFSET + 365 * (year - 1) + Math.floor(year / 4) + 30 * month + day - 31;
      const r = (jdn - GREGORIAN_EPOCH) % 146097;
      const n400 = Math.floor(r / 146097);
      const n100 = Math.floor(r % 146097 / 36524);
      const n4 = Math.floor(r % 36524 / 1461);
      const n1 = Math.floor(r % 1461 / 365);
      let gYear = 400 * n400 + 100 * n100 + 4 * n4 + n1;
      let gDay = jdn - (GREGORIAN_EPOCH + 365 * (gYear - 1) + Math.floor((gYear - 1) / 4) - Math.floor((gYear - 1) / 100) + Math.floor((gYear - 1) / 400));

      if (n100 === 4 || n1 === 4) {
        gDay = 366;
      } else {
        gYear += 1;
      }

      const isGregorianLeap = gYear % 4 === 0 && gYear % 100 !== 0 || gYear % 400 === 0;
      const gMonth = Math.floor((gDay - 1) / 31) + 1;
      const gMonths = [0, 31, isGregorianLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      let gDayOfMonth = gDay;

      for (let i = 1; i < gMonth; i++) {
        gDayOfMonth -= gMonths[i];
      }

      let gMonthName = '';

      for (let i = 1; i <= 12; i++) {
        if (gDayOfMonth <= gMonths[i]) {
          gMonthName = i;
          break;
        }

        gDayOfMonth -= gMonths[i];
      }

      return [gYear, gMonthName, gDayOfMonth];
    };

    const toEthiopian = (year, month, day) => {
      if (year === undefined || month === undefined || day === undefined) {
        const today = new Date();
        return toEthiopian(today.getFullYear(), today.getMonth() + 1, today.getDate());
      }

      const isGregorianLeap = year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
      const gMonths = [0, 31, isGregorianLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      let jdn = GREGORIAN_EPOCH - 1 + 365 * (year - 1) + Math.floor((year - 1) / 4) - Math.floor((year - 1) / 100) + Math.floor((year - 1) / 400);

      for (let i = 1; i < month; i++) {
        jdn += gMonths[i];
      }

      jdn += day;
      const r = (jdn - JD_EPOCH_OFFSET) % 1461;
      const n = r % 365;
      const eYear = 4 * Math.floor((jdn - JD_EPOCH_OFFSET) / 1461) + Math.floor(r / 365);
      const eMonth = Math.floor(n / 30) + 1;
      const eDay = n % 30 + 1;
      return [eYear, eMonth, eDay];
    };

    const defaultFormat = {
      date: true,
      time: false,
      year: true,
      month: true,
      day: true,
      dayName: false,
      amPM: false,
      hour: false,
      minute: false,
      second: false,
      millisecond: false,
      separator: '/',
      monthName: false,
      dayNameInTwo: false,
      monthNameInTwo: false
    };

    const format = (moment, options) => {
      options = { ...defaultFormat,
        ...options
      };
      let formatted = '';

      if (options.date) {
        if (options.dayName) {
          formatted += (options.dayNameInTwo ? dayNames[moment.day].substring(0, 2) : dayNames[moment.day]) + ', ';
        }

        if (options.month) {
          if (options.monthName) {
            formatted += (options.monthNameInTwo ? monthNames[moment.month - 1].substring(0, 2) : monthNames[moment.month - 1]) + ' ';
          } else {
            formatted += moment.month + options.separator;
          }
        }

        if (options.day) {
          formatted += moment.date + options.separator;
        }

        if (options.year) {
          formatted += moment.year + ' ' + era;
        }
      }

      if (options.time) {
        if (options.date) {
          formatted += ' ';
        }

        if (options.hour) {
          formatted += moment.hour + ':';
        }

        if (options.minute) {
          formatted += moment.minute + ':';
        }

        if (options.second) {
          formatted += moment.second;
        }

        if (options.millisecond) {
          formatted += '.' + moment.millisecond;
        }

        if (options.amPM) {
          formatted += ' ' + (moment.hour < 12 ? amPM.am : amPM.pm);
        }
      }

      return formatted;
    };

    class EthiopianDate {
      constructor() {
        let moment;

        if (arguments.length === 0) {
          moment = new Date();
        } else if (arguments.length === 1) {
          moment = new Date(arguments[0]);
        } else {
          const [year, month, day, hour, minute, second, millisecond] = arguments;
          const [gYear, gMonth, gDay] = toGregorian(year, month + 1, day);
          moment = new Date(gYear, gMonth - 1, gDay, hour, minute, second, millisecond);
        }

        this._moment = moment;
        const [year, month, date] = toEthiopian(moment.getFullYear(), moment.getMonth() + 1, moment.getDate());
        this._year = year;
        this._month = month;
        this._date = date;
        this._day = moment.getDay();
        this._hour = moment.getHours();
        this._minute = moment.getMinutes();
        this._second = moment.getSeconds();
        this._millisecond = moment.getMilliseconds();
      }

      get year() {
        return this._year;
      }

      get month() {
        return this._month;
      }

      get date() {
        return this._date;
      }

      get day() {
        return this._day;
      }

      get hour() {
        return this._hour;
      }

      get minute() {
        return this._minute;
      }

      get second() {
        return this._second;
      }

      get millisecond() {
        return this._millisecond;
      }

      get monthName() {
        return monthNames[this._month - 1];
      }

      get dayName() {
        return dayNames[this._day];
      }

      get amPm() {
        return this._hour < 12 ? amPM.am : amPM.pm;
      }

      get isLeap() {
        return isLeap(this._year);
      }

      get era() {
        return era;
      }

      get moment() {
        return this._moment;
      }

      set year(year) {
        const [gYear, gMonth, gDay] = toGregorian(year, this._month, this._date);

        this._moment.setFullYear(gYear, gMonth - 1, gDay);

        this._year = year;
      }

      set month(month) {
        const [gYear, gMonth, gDay] = toGregorian(this._year, month, this._date);

        this._moment.setFullYear(gYear, gMonth - 1, gDay);

        this._month = month;
      }

      set date(date) {
        const [gYear, gMonth, gDay] = toGregorian(this._year, this._month, date);

        this._moment.setFullYear(gYear, gMonth - 1, gDay);

        this._date = date;
      }

      set day(day) {
        this._moment.setDate(this._moment.getDate() - this._day + day);

        this._day = day;
      }

      set hour(hour) {
        this._moment.setHours(hour);

        this._hour = hour;
      }

      set minute(minute) {
        this._moment.setMinutes(minute);

        this._minute = minute;
      }

      set second(second) {
        this._moment.setSeconds(second);

        this._second = second;
      }

      set millisecond(millisecond) {
        this._moment.setMilliseconds(millisecond);

        this._millisecond = millisecond;
      }

      getFullYear() {
        return this._year;
      }

      getMonth() {
        return this._month - 1;
      }

      getDate() {
        return this._date;
      }

      getDay() {
        return this._day;
      }

      getHours() {
        return this._hour;
      }

      getMinutes() {
        return this._minute;
      }

      getSeconds() {
        return this._second;
      }

      getMilliseconds() {
        return this._millisecond;
      }

      setFullYear(year) {
        this.year = year;
      }

      setMonth(month) {
        this.month = month + 1;
      }

      setDate(date) {
        this.date = date;
      }

      setHours(hour) {
        this.hour = hour;
      }

      setMinutes(minute) {
        this.minute = minute;
      }

      setSeconds(second) {
        this.second = second;
      }

      setMilliseconds(millisecond) {
        this.millisecond = millisecond;
      }

      toString() {
        return format(this, {
          date: true,
          time: true,
          year: true,
          month: true,
          day: true,
          hour: true,
          minute: true,
          second: true
        });
      }

      toDateString() {
        return format(this, {
          date: true,
          year: true,
          month: true,
          day: true,
          dayName: true,
          monthName: true
        });
      }

      toTimeString() {
        return format(this, {
          time: true,
          hour: true,
          minute: true,
          second: true,
          amPM: true
        });
      }

      format(options) {
        return format(this, options);
      }

    }

    EthiopianDate.toEthiopian = toEthiopian;
    EthiopianDate.toGregorian = toGregorian;

    return EthiopianDate;

}));