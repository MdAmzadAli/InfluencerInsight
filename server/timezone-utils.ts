/**
 * Timezone utilities for international users
 */

/**
 * Convert user's local time to UTC for database storage
 * @param localDateTime - Date and time in user's timezone
 * @param userTimezone - User's timezone (e.g., 'America/New_York')
 * @returns UTC Date object for database storage
 */
export function convertToUTC(localDateTime: Date, userTimezone: string): Date {
  // Create a date in the user's timezone
  const userTime = new Date(localDateTime.toLocaleString("en-US", { timeZone: userTimezone }));
  const utcTime = new Date(localDateTime.toLocaleString("en-US", { timeZone: "UTC" }));
  
  // Calculate the offset and apply it
  const offset = userTime.getTime() - utcTime.getTime();
  return new Date(localDateTime.getTime() - offset);
}

/**
 * Convert UTC time to user's local time for display
 * @param utcDateTime - UTC date from database
 * @param userTimezone - User's timezone (e.g., 'Asia/Kolkata')
 * @returns Date object in user's local timezone
 */
export function convertFromUTC(utcDateTime: Date, userTimezone: string): Date {
  return new Date(utcDateTime.toLocaleString("en-US", { timeZone: userTimezone }));
}

/**
 * Format date and time for user's timezone
 * @param utcDateTime - UTC date from database
 * @param userTimezone - User's timezone
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in user's timezone
 */
export function formatDateTimeForUser(
  utcDateTime: Date, 
  userTimezone: string, 
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  return utcDateTime.toLocaleString("en-US", {
    ...formatOptions,
    timeZone: userTimezone
  });
}

/**
 * Get timezone abbreviation (e.g., IST, PST, EST)
 * @param userTimezone - User's timezone
 * @returns Timezone abbreviation string
 */
export function getTimezoneAbbreviation(userTimezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: userTimezone,
    timeZoneName: 'short'
  });
  
  const parts = formatter.formatToParts(now);
  const timeZoneName = parts.find(part => part.type === 'timeZoneName');
  
  return timeZoneName?.value || 'UTC';
}

/**
 * Check if it's time to send notification (comparing current UTC with scheduled UTC)
 * @param scheduledUTC - Scheduled time in UTC
 * @param currentUTC - Current time in UTC (defaults to now)
 * @returns boolean indicating if it's time to send
 */
export function isTimeToNotify(scheduledUTC: Date, currentUTC: Date = new Date()): boolean {
  return currentUTC >= scheduledUTC;
}

/**
 * Get user-friendly time display for notifications (matches scheduling board format)
 * @param scheduledUTCDate - Scheduled date stored in database (UTC)
 * @param userTimezone - User's timezone to convert from UTC storage
 * @returns Formatted time string for email notifications (e.g., "Jul 20, 12:09 AM")
 */
export function getNotificationTimeDisplay(scheduledUTCDate: Date, userTimezone: string = 'UTC'): string {
  // Use JavaScript's built-in timezone formatting to show the UTC time in user's timezone
  // This will properly convert and display the time as it would appear to the user
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric', 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: userTimezone
  };
  
  return scheduledUTCDate.toLocaleDateString('en-US', options);
}