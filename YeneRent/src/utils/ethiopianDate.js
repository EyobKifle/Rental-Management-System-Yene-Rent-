// Ethiopian date utility functions
export class EthiopianDate {
  constructor(year, month, day) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  // Convert Gregorian date to Ethiopian date
  static fromGregorian(gregorianDate) {
    // Ethiopian calendar starts 7-8 years behind Gregorian
    // This is a simplified conversion - in production, use a proper library
    const gregorianYear = gregorianDate.getFullYear();
    const gregorianMonth = gregorianDate.getMonth();
    const gregorianDay = gregorianDate.getDate();

    // Simplified conversion (not 100% accurate)
    let ethiopianYear = gregorianYear - 8;
    let ethiopianMonth = gregorianMonth;
    let ethiopianDay = gregorianDay;

    // Adjust for Ethiopian calendar differences
    if (gregorianMonth < 8 || (gregorianMonth === 8 && gregorianDay < 11)) {
      ethiopianYear = gregorianYear - 9;
    }

    // Ethiopian months have different day counts
    const monthDays = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5]; // 13th month has 5 or 6 days
    if (ethiopianDay > monthDays[ethiopianMonth]) {
      ethiopianDay = monthDays[ethiopianMonth];
    }

    return new EthiopianDate(ethiopianYear, ethiopianMonth + 1, ethiopianDay);
  }

  // Convert Ethiopian date to Gregorian date
  toGregorian() {
    // Simplified conversion (not 100% accurate)
    let gregorianYear = this.year + 8;
    let gregorianMonth = this.month - 1;
    let gregorianDay = this.day;

    if (this.month > 4 || (this.month === 4 && this.day > 21)) {
      gregorianYear = this.year + 9;
    }

    return new Date(gregorianYear, gregorianMonth, gregorianDay);
  }

  // Format Ethiopian date as string
  toString() {
    const monthNames = [
      'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
      'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
    ];

    return `${this.day} ${monthNames[this.month - 1]} ${this.year}`;
  }

  // Get current Ethiopian date
  static now() {
    return EthiopianDate.fromGregorian(new Date());
  }

  // Add days to Ethiopian date
  addDays(days) {
    const gregorian = this.toGregorian();
    gregorian.setDate(gregorian.getDate() + days);
    return EthiopianDate.fromGregorian(gregorian);
  }

  // Add months to Ethiopian date
  addMonths(months) {
    const gregorian = this.toGregorian();
    gregorian.setMonth(gregorian.getMonth() + months);
    return EthiopianDate.fromGregorian(gregorian);
  }

  // Add years to Ethiopian date
  addYears(years) {
    return new EthiopianDate(this.year + years, this.month, this.day);
  }

  // Check if date is valid Ethiopian date
  isValid() {
    if (this.month < 1 || this.month > 13) return false;
    if (this.day < 1) return false;

    const monthDays = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 6];
    if (this.month === 13) {
      // Pagume has 5 days normally, 6 in leap years
      const isLeapYear = (this.year % 4 === 3); // Ethiopian leap year rule
      return this.day <= (isLeapYear ? 6 : 5);
    }

    return this.day <= monthDays[this.month - 1];
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  getDayOfWeek() {
    return this.toGregorian().getDay();
  }

  // Get month name
  getMonthName() {
    const monthNames = [
      'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
      'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
    ];
    return monthNames[this.month - 1];
  }

  // Get year name (for Ethiopian calendar)
  getYearName() {
    // Ethiopian years have names, but simplified here
    return this.year.toString();
  }
}

// Utility functions
export const formatEthiopianDate = (date) => {
  if (date instanceof EthiopianDate) {
    return date.toString();
  }
  return EthiopianDate.fromGregorian(date).toString();
};

export const parseEthiopianDate = (dateString) => {
  // Parse Ethiopian date string (format: "day month year")
  const parts = dateString.split(' ');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]);
  const monthName = parts[1];
  const year = parseInt(parts[2]);

  const monthNames = [
    'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
    'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
  ];

  const month = monthNames.indexOf(monthName) + 1;
  if (month === 0) return null;

  const ethiopianDate = new EthiopianDate(year, month, day);
  return ethiopianDate.isValid() ? ethiopianDate : null;
};

export const getEthiopianMonths = () => {
  return [
    'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
    'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
  ];
};

export const getEthiopianMonthDays = (month, year) => {
  const monthDays = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 6];
  if (month === 13) {
    const isLeapYear = (year % 4 === 3);
    return isLeapYear ? 6 : 5;
  }
  return monthDays[month - 1];
};
