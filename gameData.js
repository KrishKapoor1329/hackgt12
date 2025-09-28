const gameData = [
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 1,
    "dist": 10,
    "time": "15:00",
    "description": "(15:00) (Shotgun) 26-S.Barkley left tackle to PHI 34 for 4 yards (6-B.Cook).",
    "posteam": "PHI",
    "yardline": "PHI 30",
    "winProbability": 46
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 2,
    "dist": 6,
    "time": "14:19",
    "description": "(14:19) (Shotgun) 1-J.Hurts pass short right to 6-D.Smith pushed ob at PHI 42 for 8 yards (20-J.Reid).",
    "posteam": "PHI",
    "yardline": "PHI 34",
    "winProbability": 46
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 1,
    "dist": 10,
    "time": "13:38",
    "description": "(13:38) (Shotgun) 26-S.Barkley right end to PHI 45 for 3 yards (20-J.Reid; 32-N.Bolton).",
    "posteam": "PHI",
    "yardline": "PHI 42",
    "winProbability": 48
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 2,
    "dist": 7,
    "time": "12:57",
    "description": "(12:57) (Shotgun) 1-J.Hurts pass short left to 26-S.Barkley to PHI 41 for -4 yards (32-N.Bolton).",
    "posteam": "PHI",
    "yardline": "PHI 45",
    "winProbability": 45
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 3,
    "dist": 11,
    "time": "12:26",
    "description": "(12:26) (No Huddle, Shotgun) 1-J.Hurts scrambles right guard pushed ob at 50 for 9 yards (6-B.Cook).",
    "posteam": "PHI",
    "yardline": "PHI 41",
    "winProbability": 41
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 4,
    "dist": 2,
    "time": "11:41",
    "description": "(11:41) (Shotgun) 1-J.Hurts pass deep right to 11-A.Brown ran ob at KC 18 for 32 yards. PENALTY on PHI-11-A.Brown, Offensive Pass Interference, 10 yards, enforced at 50 - No Play.",
    "posteam": "PHI",
    "yardline": "PHI 50",
    "winProbability": 41
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "isEvent": true,
    "description": "Punt",
    "winProbability": 38
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 1,
    "dist": 10,
    "time": "11:21",
    "description": "(11:21) (Shotgun) 15-P.Mahomes pass short right to 9-J.Smith-Schuster to KC 23 for 11 yards (8-C.Gardner-Johnson; 32-R.Blankenship).",
    "posteam": "KC",
    "yardline": "KC 12",
    "winProbability": 42
  },
  {
    "homeScore": 0,
    "awayScore": 0,
    "qtr": 1,
    "down": 1,
    "dist": 10,
    "time": "10:41",
    "description": "(10:41) (Shotgun) 15-P.Mahomes pass short left to 1-X.Worthy to KC 24 for 1 yard (33-C.DeJean).",
    "posteam": "KC",
    "yardline": "KC 23",
    "winProbability": 41
  },
  {
    "homeScore": 0,
    "awayScore": 7,
    "qtr": 1,
    "isEvent": true,
    "description": "Eagles score a touchdown. J.Hurts 1 yard rush.",
    "winProbability": 58
  },
  {
    "homeScore": 0,
    "awayScore": 10,
    "qtr": 2,
    "isEvent": true,
    "description": "Eagles kick a 48-yard field goal.",
    "winProbability": 64
  },
  {
    "homeScore": 0,
    "awayScore": 17,
    "qtr": 2,
    "isEvent": true,
    "description": "Eagles interception return for a touchdown.",
    "winProbability": 82
  },
  {
    "homeScore": 0,
    "awayScore": 24,
    "qtr": 2,
    "isEvent": true,
    "description": "Eagles score a touchdown. J.Hurts pass to A.Brown for 12 yards.",
    "winProbability": 95
  },
  {
    "homeScore": 0,
    "awayScore": 24,
    "qtr": 2,
    "isEvent": true,
    "description": "End of First Half."
  },
  {
    "homeScore": 0,
    "awayScore": 27,
    "qtr": 3,
    "isEvent": true,
    "description": "Eagles kick a 29-yard field goal.",
    "winProbability": 100
  },
  {
    "homeScore": 0,
    "awayScore": 34,
    "qtr": 3,
    "isEvent": true,
    "description": "Eagles score a touchdown. J.Hurts pass to D.Smith for 46 yards.",
    "winProbability": 100
  },
  {
    "homeScore": 6,
    "awayScore": 34,
    "qtr": 3,
    "isEvent": true,
    "description": "Chiefs score a touchdown. P.Mahomes pass to X.Worthy for 24 yards.",
    "winProbability": 100
  },
  {
    "homeScore": 6,
    "awayScore": 37,
    "qtr": 4,
    "isEvent": true,
    "description": "Eagles kick a 48-yard field goal.",
    "winProbability": 100
  },
  {
    "homeScore": 6,
    "awayScore": 40,
    "qtr": 4,
    "isEvent": true,
    "description": "Eagles kick a 50-yard field goal.",
    "winProbability": 100
  },
  {
    "homeScore": 14,
    "awayScore": 40,
    "qtr": 4,
    "isEvent": true,
    "description": "Chiefs score a touchdown. P.Mahomes pass to D.Hopkins for 7 yards.",
    "winProbability": 100
  },
  {
    "homeScore": 22,
    "awayScore": 40,
    "qtr": 4,
    "isEvent": true,
    "description": "Chiefs score a touchdown. P.Mahomes pass to X.Worthy for 50 yards.",
    "winProbability": 100
  },
  {
    "homeScore": 22,
    "awayScore": 40,
    "qtr": 4,
    "isEvent": true,
    "description": "End of Game."
  }
];

module.exports = gameData;
