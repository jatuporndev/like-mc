/**
 * Thai / English UI strings.
 *
 * Flat dot-namespaced keys. Add a key to BOTH `en` and `th`; the `t()` helper
 * is typed against the `en` keys so a missing Thai entry is a compile error.
 */
export const LANGUAGES = ["en", "th"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Lang, string> = {
  en: "EN",
  th: "ไทย",
};

const en = {
  // Navbar
  "nav.matches": "Matches",
  "nav.leaderboard": "Leaderboard",
  "nav.admin": "Admin",
  "nav.signOut": "Sign out",

  // Champion banner
  "banner.yourPick": "Your champion pick",

  // Champion page
  "champion.title": "Pick Your World Cup Champion",
  "champion.desc":
    "Choose the one nation you think will lift the trophy. This pick is permanent — you can't change it later.",
  "champion.searchPlaceholder": "Search countries…",
  "champion.noMatch": "No countries match",
  "champion.select": "Select a team",
  "champion.confirm": "Confirm",
  "champion.lockedTitle": "Champion locked in!",
  "champion.lockedDesc": "is your pick for the World Cup 🏆",
  "champion.errorTitle": "Could not save pick",
  "champion.errorDesc": "Try again.",
  "champion.required":
    "You must pick a champion before you can enter the game.",

  // Dashboard
  "dash.welcome": "Welcome back",
  "dash.pointsPre": "You have",
  "dash.pointsPost": "Make your calls before kickoff.",
  "dash.point": "point",
  "dash.points": "points",
  "dash.matches": "Matches",
  "dash.leaderboard": "Leaderboard",
  "dash.viewAll": "View all",
  "dash.championBonus": "champion bonus",

  // Leaderboard page
  "lb.title": "Leaderboard",
  "lb.subtitle":
    "One point per correct match prediction, plus champion bonus points for how far your champion pick advances (final +5, semi +3, quarter +1, winner +10).",
  "lb.bonus": "champion bonus",

  // Match day labels
  "day.today": "Today",
  "day.tomorrow": "Tomorrow",
  "day.yesterday": "Yesterday",

  // Matches board
  "board.playingNow": "Playing now",
  "board.upcoming": "Upcoming",
  "board.completed": "Completed",
  "board.group": "Group",
  "board.noMatches": "No matches yet",
  "board.noMatchesDesc":
    "Matches appear here once an admin runs the first sync from football-data.org.",
  "board.noUpcoming": "No upcoming matches",
  "board.noUpcomingDesc": "All scheduled matches have kicked off.",
  "board.noCompleted": "No completed matches yet",
  "board.noCompletedDesc": "Played matches will show up here with results.",

  // Match card
  "match.draw": "Draw",
  "match.vs": "vs",
  "match.playing": "Playing",
  "match.you": "You",
  "match.correct": "Correct prediction · +1",
  "match.wrong": "Wrong prediction",
  "match.lockedAwaiting": "Locked · awaiting result",
  "match.lockedNoPick": "Locked · no prediction made",
  "match.saved": "Prediction saved",
  "match.makePrediction": "Make your prediction before kickoff",
  "match.saveError": "Could not save prediction",
  "match.tryAgain": "Try again.",

  // Generic
  "common.loading": "Loading…",
} as const;

export type MessageKey = keyof typeof en;

const th: Record<MessageKey, string> = {
  // Navbar
  "nav.matches": "แมตช์",
  "nav.leaderboard": "ตารางคะแนน",
  "nav.admin": "ผู้ดูแล",
  "nav.signOut": "ออกจากระบบ",

  // Champion banner
  "banner.yourPick": "ทีมแชมป์ที่คุณเลือก",

  // Champion page
  "champion.title": "เลือกทีมแชมป์ฟุตบอลโลกของคุณ",
  "champion.desc":
    "เลือกชาติที่คุณคิดว่าจะคว้าแชมป์ การเลือกนี้ถาวร — ไม่สามารถเปลี่ยนได้ภายหลัง",
  "champion.searchPlaceholder": "ค้นหาประเทศ…",
  "champion.noMatch": "ไม่พบประเทศที่ตรงกับ",
  "champion.select": "เลือกทีม",
  "champion.confirm": "ยืนยัน",
  "champion.lockedTitle": "ล็อกทีมแชมป์เรียบร้อย!",
  "champion.lockedDesc": "คือทีมที่คุณเลือกสำหรับฟุตบอลโลก 🏆",
  "champion.errorTitle": "บันทึกการเลือกไม่สำเร็จ",
  "champion.errorDesc": "กรุณาลองอีกครั้ง",
  "champion.required": "คุณต้องเลือกทีมแชมป์ก่อนจึงจะเข้าเล่นเกมได้",

  // Dashboard
  "dash.welcome": "ยินดีต้อนรับกลับ",
  "dash.pointsPre": "คุณมี",
  "dash.pointsPost": "ทายผลให้เสร็จก่อนเริ่มแข่ง",
  "dash.point": "คะแนน",
  "dash.points": "คะแนน",
  "dash.matches": "แมตช์",
  "dash.leaderboard": "ตารางคะแนน",
  "dash.viewAll": "ดูทั้งหมด",
  "dash.championBonus": "โบนัสทีมแชมป์",

  // Leaderboard page
  "lb.title": "ตารางคะแนน",
  "lb.subtitle":
    "ทายผลถูกได้แมตช์ละ 1 คะแนน บวกคะแนนโบนัสตามรอบที่ทีมแชมป์ที่เลือกไปถึง (รอบชิง +5, รองชนะเลิศ +3, ก่อนรองฯ +1, ชนะเลิศ +10)",
  "lb.bonus": "โบนัสทีมแชมป์",

  // Match day labels
  "day.today": "วันนี้",
  "day.tomorrow": "พรุ่งนี้",
  "day.yesterday": "เมื่อวาน",

  // Matches board
  "board.playingNow": "กำลังแข่งอยู่",
  "board.upcoming": "กำลังจะแข่ง",
  "board.completed": "แข่งจบแล้ว",
  "board.group": "กลุ่ม",
  "board.noMatches": "ยังไม่มีแมตช์",
  "board.noMatchesDesc":
    "แมตช์จะปรากฏที่นี่เมื่อผู้ดูแลซิงค์ข้อมูลครั้งแรกจาก football-data.org",
  "board.noUpcoming": "ไม่มีแมตช์ที่กำลังจะแข่ง",
  "board.noUpcomingDesc": "แมตช์ที่กำหนดไว้ทั้งหมดเริ่มแข่งแล้ว",
  "board.noCompleted": "ยังไม่มีแมตช์ที่แข่งจบ",
  "board.noCompletedDesc": "แมตช์ที่แข่งจบแล้วจะแสดงที่นี่พร้อมผลการแข่งขัน",

  // Match card
  "match.draw": "เสมอ",
  "match.vs": "พบ",
  "match.playing": "กำลังแข่ง",
  "match.you": "คุณ",
  "match.correct": "ทายถูก · +1",
  "match.wrong": "ทายผิด",
  "match.lockedAwaiting": "ล็อกแล้ว · รอผล",
  "match.lockedNoPick": "ล็อกแล้ว · ไม่ได้ทายผล",
  "match.saved": "บันทึกการทายแล้ว",
  "match.makePrediction": "ทายผลก่อนเริ่มแข่ง",
  "match.saveError": "บันทึกการทายไม่สำเร็จ",
  "match.tryAgain": "กรุณาลองอีกครั้ง",

  // Generic
  "common.loading": "กำลังโหลด…",
};

export const MESSAGES: Record<Lang, Record<MessageKey, string>> = { en, th };
