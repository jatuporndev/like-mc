/**
 * Google Apps Script — scheduled World Cup match sync.
 *
 * Calls the app's secure sync endpoint with the shared SYNC_SECRET so match
 * data and scores stay fresh without any realtime infrastructure.
 *
 * ── Setup ─────────────────────────────────────────────────────────────────
 * 1. Create a new project at https://script.google.com
 * 2. Paste this file in.
 * 3. Project Settings → Script properties, add:
 *      APP_URL      = https://your-app.vercel.app
 *      SYNC_SECRET  = (the same value as in your app env)
 * 4. Run `syncMatches` once to authorize the script.
 * 5. Run `createTriggers` once to schedule it (01:00, 07:00, 13:00, 19:00).
 * ──────────────────────────────────────────────────────────────────────────
 */

function syncMatches() {
  var props = PropertiesService.getScriptProperties();
  var appUrl = props.getProperty('APP_URL');
  var secret = props.getProperty('SYNC_SECRET');

  if (!appUrl || !secret) {
    throw new Error('Set APP_URL and SYNC_SECRET in Script properties.');
  }

  var response = UrlFetchApp.fetch(appUrl + '/api/admin/sync-matches', {
    method: 'post',
    headers: { Authorization: 'Bearer ' + secret },
    muteHttpExceptions: true,
  });

  Logger.log('Status: ' + response.getResponseCode());
  Logger.log('Body: ' + response.getContentText());
}

/** Create the 4x-daily triggers (run once). */
function createTriggers() {
  // Clear existing triggers for this function to avoid duplicates.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncMatches') {
      ScriptApp.deleteTrigger(t);
    }
  });

  [1, 7, 13, 19].forEach(function (hour) {
    ScriptApp.newTrigger('syncMatches')
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();
  });

  Logger.log('Created 4 daily triggers at 01:00, 07:00, 13:00, 19:00.');
}
