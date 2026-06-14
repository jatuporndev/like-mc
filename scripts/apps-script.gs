/**
 * Google Apps Script — scheduled World Cup sync.
 *
 * Both jobs call the SAME endpoint: POST /api/admin/sync-matches with the shared
 * SYNC_SECRET. That endpoint fetches the latest matches AND scores from
 * football-data.org and recalculates every user's points in one request — so
 * there is no separate "scores only" call to make.
 *
 *   syncScores()  → run hourly  (keeps live scores + the leaderboard fresh)
 *   syncMatches() → run daily   (picks up schedule/fixture changes)
 *
 * They hit the same URL; the split just gives you two independent cadences and
 * clearer logs. The /api/admin/recalculate-points endpoint is intentionally NOT
 * used here — it requires a short-lived admin login token, not the SYNC_SECRET,
 * so it can't be automated. You don't need it: sync-matches already recalcs.
 *
 * ── Setup ─────────────────────────────────────────────────────────────────
 * 1. Create a new project at https://script.google.com
 * 2. Paste this file in.
 * 3. Project Settings → Script properties, add:
 *      APP_URL      = https://like-mc.vercel.app   (no trailing slash)
 *      SYNC_SECRET  = (the same value as SYNC_SECRET in your Vercel env)
 * 4. Run `syncScores` once to authorize the script (grant permissions).
 * 5. Run `createTriggers` once to schedule everything.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Hourly job: refresh live scores and recalculate the leaderboard. */
function syncScores() {
  return callSync_('scores');
}

/** Daily job: refresh the full match list / fixtures. */
function syncMatches() {
  return callSync_('matches');
}

/** Shared caller — both jobs POST to /api/admin/sync-matches. */
function callSync_(reason) {
  var props = PropertiesService.getScriptProperties();
  var appUrl = props.getProperty('APP_URL');
  var secret = props.getProperty('SYNC_SECRET');

  if (!appUrl || !secret) {
    throw new Error('Set APP_URL and SYNC_SECRET in Script properties.');
  }

  // Strip any trailing slash so we never produce a double "//api/...".
  var url = appUrl.replace(/\/+$/, '') + '/api/admin/sync-matches';

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret },
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  Logger.log('[%s] %s %s', reason, code, body);

  if (code < 200 || code >= 300) {
    throw new Error('Sync failed (' + code + '): ' + body);
  }
  return body;
}

/**
 * Install the schedule (run once). Safe to re-run — it clears this script's
 * existing triggers first so you never stack duplicates.
 *   - syncScores  : every 1 hour
 *   - syncMatches : every 1 day, around 04:00 in the project's timezone
 */
function createTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'syncScores' || fn === 'syncMatches') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('syncScores')
    .timeBased()
    .everyHours(1)
    .create();

  ScriptApp.newTrigger('syncMatches')
    .timeBased()
    .everyDays(1)
    .atHour(4)
    .create();

  Logger.log('Triggers installed: syncScores hourly, syncMatches daily ~04:00.');
}

/** Remove every trigger this script created (run if you want to stop syncing). */
function deleteTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'syncScores' || fn === 'syncMatches') {
      ScriptApp.deleteTrigger(t);
    }
  });
  Logger.log('Removed syncScores / syncMatches triggers.');
}
