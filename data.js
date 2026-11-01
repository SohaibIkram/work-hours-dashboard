// Initial pre-loaded dataset from Time_In_Out_Tracking.xlsx
const INITIAL_DATA = [
  {
    "date": "2026-07-01",
    "day": "Wednesday",
    "timeIn": "10:18",
    "timeOut": "20:28",
    "workingHoursMin": 516.3166666666671,
    "totalTimeMin": 610.516666666666,
    "status": "",
    "minutesBalance": 36.0
  },
  {
    "date": "2026-07-02",
    "day": "Thursday",
    "timeIn": "10:35",
    "timeOut": "18:47",
    "workingHoursMin": 472.5,
    "totalTimeMin": 491.78333333333376,
    "status": "",
    "minutesBalance": -8.0
  },
  {
    "date": "2026-07-03",
    "day": "Friday",
    "timeIn": "10:11",
    "timeOut": "18:56",
    "workingHoursMin": 479.26666666666654,
    "totalTimeMin": 525.4499999999995,
    "status": "",
    "minutesBalance": -1.0
  },
  {
    "date": "2026-07-04",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-05",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-06",
    "day": "Monday",
    "timeIn": "10:18",
    "timeOut": "18:20",
    "workingHoursMin": 458.4500000000006,
    "totalTimeMin": 481.7333333333333,
    "status": "",
    "minutesBalance": -22.0
  },
  {
    "date": "2026-07-07",
    "day": "Tuesday",
    "timeIn": "10:45",
    "timeOut": "20:53",
    "workingHoursMin": 582.0666666666667,
    "totalTimeMin": 607.0999999999997,
    "status": "",
    "minutesBalance": 102.0
  },
  {
    "date": "2026-07-08",
    "day": "Wednesday",
    "timeIn": "10:53",
    "timeOut": "18:21",
    "workingHoursMin": 443.1500000000006,
    "totalTimeMin": 448.06666666666604,
    "status": "",
    "minutesBalance": -37.0
  },
  {
    "date": "2026-07-09",
    "day": "Thursday",
    "timeIn": "11:00",
    "timeOut": "20:13",
    "workingHoursMin": 541.6833333333341,
    "totalTimeMin": 553.3666666666661,
    "status": "",
    "minutesBalance": 61.0
  },
  {
    "date": "2026-07-10",
    "day": "Friday",
    "timeIn": "11:07",
    "timeOut": "17:33",
    "workingHoursMin": 337.2000000000005,
    "totalTimeMin": 385.7666666666674,
    "status": "",
    "minutesBalance": -143.0
  },
  {
    "date": "2026-07-11",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-12",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-13",
    "day": "Monday",
    "timeIn": "10:41",
    "timeOut": "22:37",
    "workingHoursMin": 655.3166666666674,
    "totalTimeMin": 716.1000000000006,
    "status": "",
    "minutesBalance": 175.0
  },
  {
    "date": "2026-07-14",
    "day": "Tuesday",
    "timeIn": "10:35",
    "timeOut": "20:56",
    "workingHoursMin": 555.6833333333337,
    "totalTimeMin": 620.6333333333329,
    "status": "",
    "minutesBalance": 75.0
  },
  {
    "date": "2026-07-15",
    "day": "Wednesday",
    "timeIn": "11:20",
    "timeOut": "20:28",
    "workingHoursMin": 515.0000000000001,
    "totalTimeMin": 548.1166666666664,
    "status": "",
    "minutesBalance": 35.0
  },
  {
    "date": "2026-07-16",
    "day": "Thursday",
    "timeIn": "10:41",
    "timeOut": "19:25",
    "workingHoursMin": 506.36666666666736,
    "totalTimeMin": 524.8000000000009,
    "status": "",
    "minutesBalance": 26.0
  },
  {
    "date": "2026-07-17",
    "day": "Friday",
    "timeIn": "10:31",
    "timeOut": "19:08",
    "workingHoursMin": 473.116666666667,
    "totalTimeMin": 517.333333333333,
    "status": "",
    "minutesBalance": -7.0
  },
  {
    "date": "2026-07-18",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-19",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-20",
    "day": "Monday",
    "timeIn": "10:47",
    "timeOut": "19:23",
    "workingHoursMin": 493.04999999999956,
    "totalTimeMin": 515.566666666666,
    "status": "",
    "minutesBalance": 13.0
  },
  {
    "date": "2026-07-21",
    "day": "Tuesday",
    "timeIn": "10:42",
    "timeOut": "22:04",
    "workingHoursMin": 616.0166666666669,
    "totalTimeMin": 681.7333333333336,
    "status": "",
    "minutesBalance": 136.0
  },
  {
    "date": "2026-07-22",
    "day": "Wednesday",
    "timeIn": "10:21",
    "timeOut": "18:07",
    "workingHoursMin": 428.8999999999997,
    "totalTimeMin": 466.29999999999933,
    "status": "",
    "minutesBalance": -52.0
  },
  {
    "date": "2026-07-23",
    "day": "Thursday",
    "timeIn": "10:35",
    "timeOut": "18:29",
    "workingHoursMin": 444.98333333333375,
    "totalTimeMin": 474.39999999999935,
    "status": "",
    "minutesBalance": -36.0
  },
  {
    "date": "2026-07-24",
    "day": "Friday",
    "timeIn": "09:13",
    "timeOut": "18:18",
    "workingHoursMin": 495.83333333333377,
    "totalTimeMin": 545.4999999999993,
    "status": "",
    "minutesBalance": 15.0
  },
  {
    "date": "2026-07-25",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-26",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-07-27",
    "day": "Monday",
    "timeIn": "10:22",
    "timeOut": "22:40",
    "workingHoursMin": 688.9166666666669,
    "totalTimeMin": 738.5500000000009,
    "status": "",
    "minutesBalance": 209.0
  },
  {
    "date": "2026-07-28",
    "day": "Tuesday",
    "timeIn": "10:54",
    "timeOut": "19:13",
    "workingHoursMin": 485.3499999999998,
    "totalTimeMin": 498.9333333333341,
    "status": "",
    "minutesBalance": 5.0
  },
  {
    "date": "2026-07-29",
    "day": "Wednesday",
    "timeIn": "11:30",
    "timeOut": "18:30",
    "workingHoursMin": 398.5666666666661,
    "totalTimeMin": 419.1166666666671,
    "status": "",
    "minutesBalance": -81.0
  },
  {
    "date": "2026-07-30",
    "day": "Thursday",
    "timeIn": "11:14",
    "timeOut": "18:40",
    "workingHoursMin": 433.6166666666664,
    "totalTimeMin": 446.6000000000002,
    "status": "",
    "minutesBalance": -47.0
  },
  {
    "date": "2026-07-31",
    "day": "Friday",
    "timeIn": "11:23",
    "timeOut": "18:51",
    "workingHoursMin": 403.81666666666706,
    "totalTimeMin": 447.74999999999994,
    "status": "",
    "minutesBalance": -77.0
  },
  {
    "date": "2026-08-01",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-02",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-03",
    "day": "Monday",
    "timeIn": "10:40",
    "timeOut": "20:02",
    "workingHoursMin": 538.366666666667,
    "totalTimeMin": 562.666666666667,
    "status": "",
    "minutesBalance": 58.0
  },
  {
    "date": "2026-08-04",
    "day": "Tuesday",
    "timeIn": "10:44",
    "timeOut": "18:35",
    "workingHoursMin": 447.0333333333336,
    "totalTimeMin": 471.2833333333339,
    "status": "",
    "minutesBalance": -33.0
  },
  {
    "date": "2026-08-05",
    "day": "Wednesday",
    "timeIn": "11:17",
    "timeOut": "18:10",
    "workingHoursMin": 396.51666666666625,
    "totalTimeMin": 413.5166666666669,
    "status": "",
    "minutesBalance": -83.0
  },
  {
    "date": "2026-08-06",
    "day": "Thursday",
    "timeIn": "11:22",
    "timeOut": "19:16",
    "workingHoursMin": 440.3333333333333,
    "totalTimeMin": 474.39999999999935,
    "status": "",
    "minutesBalance": -40.0
  },
  {
    "date": "2026-08-07",
    "day": "Friday",
    "timeIn": "10:36",
    "timeOut": "20:07",
    "workingHoursMin": 522.3833333333337,
    "totalTimeMin": 571.1499999999994,
    "status": "",
    "minutesBalance": 42.0
  },
  {
    "date": "2026-08-08",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-09",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-10",
    "day": "Monday",
    "timeIn": "10:20",
    "timeOut": "21:35",
    "workingHoursMin": 609.4833333333336,
    "totalTimeMin": 675.6333333333336,
    "status": "",
    "minutesBalance": 129.0
  },
  {
    "date": "2026-08-11",
    "day": "Tuesday",
    "timeIn": "10:55",
    "timeOut": "20:05",
    "workingHoursMin": 424.5666666666667,
    "totalTimeMin": 549.8000000000006,
    "status": "",
    "minutesBalance": -56.0
  },
  {
    "date": "2026-08-12",
    "day": "Wednesday",
    "timeIn": "11:56",
    "timeOut": "19:59",
    "workingHoursMin": 426.7666666666671,
    "totalTimeMin": 483.0333333333336,
    "status": "",
    "minutesBalance": -54.0
  },
  {
    "date": "2026-08-13",
    "day": "Thursday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": 479.9999999999995,
    "totalTimeMin": null,
    "status": "Absent",
    "minutesBalance": 0.0
  },
  {
    "date": "2026-08-14",
    "day": "Friday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Independence Day",
    "minutesBalance": null
  },
  {
    "date": "2026-08-15",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-16",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-17",
    "day": "Monday",
    "timeIn": "12:00",
    "timeOut": "18:52",
    "workingHoursMin": 392.0166666666663,
    "totalTimeMin": 412.4333333333333,
    "status": "",
    "minutesBalance": -88.0
  },
  {
    "date": "2026-08-18",
    "day": "Tuesday",
    "timeIn": "11:24",
    "timeOut": "20:04",
    "workingHoursMin": 472.333333333333,
    "totalTimeMin": 519.5666666666664,
    "status": "",
    "minutesBalance": -8.0
  },
  {
    "date": "2026-08-19",
    "day": "Wednesday",
    "timeIn": "11:22",
    "timeOut": "17:48",
    "workingHoursMin": 367.0666666666661,
    "totalTimeMin": 385.55000000000064,
    "status": "",
    "minutesBalance": -113.0
  },
  {
    "date": "2026-08-20",
    "day": "Thursday",
    "timeIn": "11:52",
    "timeOut": "18:34",
    "workingHoursMin": 380.4000000000005,
    "totalTimeMin": 401.6000000000002,
    "status": "",
    "minutesBalance": -100.0
  },
  {
    "date": "2026-08-21",
    "day": "Friday",
    "timeIn": "11:25",
    "timeOut": "18:07",
    "workingHoursMin": 348.8333333333328,
    "totalTimeMin": 402.5666666666664,
    "status": "",
    "minutesBalance": -132.0
  },
  {
    "date": "2026-08-22",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-23",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-24",
    "day": "Monday",
    "timeIn": "10:16",
    "timeOut": "19:45",
    "workingHoursMin": 552.0666666666673,
    "totalTimeMin": 569.0166666666668,
    "status": "",
    "minutesBalance": 72.0
  },
  {
    "date": "2026-08-25",
    "day": "Tuesday",
    "timeIn": "10:47",
    "timeOut": "18:10",
    "workingHoursMin": 426.7666666666671,
    "totalTimeMin": 442.6333333333329,
    "status": "",
    "minutesBalance": -54.0
  },
  {
    "date": "2026-08-26",
    "day": "Wednesday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Prophet Muhammad's Birthday",
    "minutesBalance": null
  },
  {
    "date": "2026-08-27",
    "day": "Thursday",
    "timeIn": "10:44",
    "timeOut": "18:43",
    "workingHoursMin": 464.2499999999995,
    "totalTimeMin": 479.36666666666736,
    "status": "",
    "minutesBalance": -16.0
  },
  {
    "date": "2026-08-28",
    "day": "Friday",
    "timeIn": "10:54",
    "timeOut": "18:34",
    "workingHoursMin": 361.3000000000003,
    "totalTimeMin": 459.3666666666672,
    "status": "",
    "minutesBalance": -119.0
  },
  {
    "date": "2026-08-29",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-30",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-08-31",
    "day": "Monday",
    "timeIn": "11:23",
    "timeOut": "18:11",
    "workingHoursMin": 379.9166666666673,
    "totalTimeMin": 407.51666666666637,
    "status": "",
    "minutesBalance": -101.0
  },
  {
    "date": "2026-09-01",
    "day": "Tuesday",
    "timeIn": "11:18",
    "timeOut": "18:59",
    "workingHoursMin": 448.9833333333341,
    "totalTimeMin": 460.5333333333336,
    "status": "",
    "minutesBalance": -32.0
  },
  {
    "date": "2026-09-02",
    "day": "Wednesday",
    "timeIn": "11:44",
    "timeOut": "18:16",
    "workingHoursMin": 362.6833333333334,
    "totalTimeMin": 391.666666666667,
    "status": "",
    "minutesBalance": -118.0
  },
  {
    "date": "2026-09-03",
    "day": "Thursday",
    "timeIn": "10:44",
    "timeOut": "18:01",
    "workingHoursMin": 405.6999999999999,
    "totalTimeMin": 436.666666666667,
    "status": "",
    "minutesBalance": -75.0
  },
  {
    "date": "2026-09-04",
    "day": "Friday",
    "timeIn": "11:24",
    "timeOut": "18:19",
    "workingHoursMin": 353.5166666666664,
    "totalTimeMin": 415.5500000000001,
    "status": "",
    "minutesBalance": -127.0
  },
  {
    "date": "2026-09-05",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Prophet Muhammad's Birthday",
    "minutesBalance": null
  },
  {
    "date": "2026-09-06",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-09-07",
    "day": "Monday",
    "timeIn": "12:19",
    "timeOut": "13:23",
    "workingHoursMin": 286.7499999999994,
    "totalTimeMin": 64.25000000000007,
    "status": "+4 hrs official short leave applied",
    "minutesBalance": -194.0
  },
  {
    "date": "2026-09-08",
    "day": "Tuesday",
    "timeIn": "11:19",
    "timeOut": "21:59",
    "workingHoursMin": 607.0999999999997,
    "totalTimeMin": 639.4333333333334,
    "status": "",
    "minutesBalance": 127.0
  },
  {
    "date": "2026-09-09",
    "day": "Wednesday",
    "timeIn": "11:11",
    "timeOut": "20:00",
    "workingHoursMin": 487.0166666666674,
    "totalTimeMin": 528.9333333333335,
    "status": "",
    "minutesBalance": 7.0
  },
  {
    "date": "2026-09-10",
    "day": "Thursday",
    "timeIn": "10:56",
    "timeOut": "21:35",
    "workingHoursMin": 555.6333333333341,
    "totalTimeMin": 639.4000000000004,
    "status": "",
    "minutesBalance": 75.0
  },
  {
    "date": "2026-09-11",
    "day": "Friday",
    "timeIn": "10:51",
    "timeOut": "18:40",
    "workingHoursMin": 359.25000000000045,
    "totalTimeMin": 468.88333333333344,
    "status": "",
    "minutesBalance": -121.0
  },
  {
    "date": "2026-09-12",
    "day": "Saturday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-09-13",
    "day": "Sunday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": null,
    "totalTimeMin": null,
    "status": "Weekend",
    "minutesBalance": null
  },
  {
    "date": "2026-09-14",
    "day": "Monday",
    "timeIn": "11:18",
    "timeOut": "14:28",
    "workingHoursMin": 395.95000000000033,
    "totalTimeMin": 190.70000000000064,
    "status": "Official Short Day",
    "minutesBalance": -84.0
  },
  {
    "date": "2026-09-15",
    "day": "Tuesday",
    "timeIn": "-",
    "timeOut": "-",
    "workingHoursMin": 479.9999999999995,
    "totalTimeMin": null,
    "status": "Karachi",
    "minutesBalance": 0.0
  },
  {
    "date": "2026-09-16",
    "day": "Wednesday",
    "timeIn": "10:35",
    "timeOut": "18:48",
    "workingHoursMin": 466.49999999999955,
    "totalTimeMin": 493.4333333333333,
    "status": "",
    "minutesBalance": -14.0
  },
  {
    "date": "2026-09-17",
    "day": "Thursday",
    "timeIn": "10:57",
    "timeOut": "19:52",
    "workingHoursMin": 502.89999999999986,
    "totalTimeMin": 534.2166666666662,
    "status": "",
    "minutesBalance": 22.0
  },
  {
    "date": "2026-09-18",
    "day": "Friday",
    "timeIn": "11:13",
    "timeOut": "18:16",
    "workingHoursMin": 384.3166666666666,
    "totalTimeMin": 423.1666666666671,
    "status": "",
    "minutesBalance": -96.0
  },
  {
    "date": "2026-09-21",
    "day": "Monday",
    "timeIn": "10:58",
    "timeOut": "16:31",
    "workingHoursMin": 489.10000000000036,
    "totalTimeMin": 333.1500000000005,
    "status": "Casual Short Day",
    "minutesBalance": 9.0
  },
  {
    "date": "2026-09-22",
    "day": "Tuesday",
    "timeIn": "11:18",
    "timeOut": "22:07",
    "workingHoursMin": 540.783333333334,
    "totalTimeMin": 648.8666666666668,
    "status": "",
    "minutesBalance": 60.0
  },
  {
    "date": "2026-09-23",
    "day": "Wednesday",
    "timeIn": "11:07",
    "timeOut": "21:50",
    "workingHoursMin": 557.3999999999995,
    "totalTimeMin": 643.4666666666668,
    "status": "",
    "minutesBalance": 77.0
  },
  {
    "date": "2026-09-24",
    "day": "Thursday",
    "timeIn": "11:38",
    "timeOut": "21:49",
    "workingHoursMin": 500.46666666666624,
    "totalTimeMin": 610.9666666666661,
    "status": "",
    "minutesBalance": 20.0
  },
  {
    "date": "2026-09-25",
    "day": "Friday",
    "timeIn": "11:28",
    "timeOut": "19:34",
    "workingHoursMin": 445.95,
    "totalTimeMin": 485.84999999999957,
    "status": "",
    "minutesBalance": -35.0
  },
  {
    "date": "2026-09-28",
    "day": "Monday",
    "timeIn": "08:56",
    "timeOut": "20:14",
    "workingHoursMin": 631.5666666666667,
    "totalTimeMin": 678.4333333333329,
    "status": "",
    "minutesBalance": 151.0
  },
  {
    "date": "2026-09-29",
    "day": "Tuesday",
    "timeIn": "09:26",
    "timeOut": "18:14",
    "workingHoursMin": 435.10000000000036,
    "totalTimeMin": 527.3500000000004,
    "status": "",
    "minutesBalance": -45.0
  },
  {
    "date": "2026-09-30",
    "day": "Wednesday",
    "timeIn": "10:43",
    "timeOut": "22:30",
    "workingHoursMin": 581.7833333333338,
    "totalTimeMin": 707.5833333333336,
    "status": "",
    "minutesBalance": 101.0
  },
  {
    "date": "2026-10-01",
    "day": "Thursday",
    "timeIn": "09:23",
    "timeOut": "19:10",
    "workingHoursMin": 574.4999999999995,
    "totalTimeMin": 586.9833333333336,
    "status": "",
    "minutesBalance": 94.0
  },
  {
    "date": "2026-10-02",
    "day": "Friday",
    "timeIn": "11:04",
    "timeOut": "20:11",
    "workingHoursMin": 499.5666666666662,
    "totalTimeMin": 546.9999999999998,
    "status": "",
    "minutesBalance": 19.0
  },
  {
    "date": "2026-10-05",
    "day": "Monday",
    "timeIn": "11:11",
    "timeOut": "18:29",
    "workingHoursMin": 391.7166666666667,
    "totalTimeMin": 438.56666666666644,
    "status": "",
    "minutesBalance": -89.0
  },
  {
    "date": "2026-10-06",
    "day": "Tuesday",
    "timeIn": "11:25",
    "timeOut": "18:23",
    "workingHoursMin": 386.98333333333346,
    "totalTimeMin": 418.61666666666736,
    "status": "",
    "minutesBalance": -94.0
  },
  {
    "date": "2026-10-07",
    "day": "Wednesday",
    "timeIn": "11:14",
    "timeOut": "20:38",
    "workingHoursMin": 504.2666666666664,
    "totalTimeMin": 564.2166666666672,
    "status": "",
    "minutesBalance": 24.0
  },
  {
    "date": "2026-10-08",
    "day": "Thursday",
    "timeIn": "11:23",
    "timeOut": "21:58",
    "workingHoursMin": 569.2333333333336,
    "totalTimeMin": 634.666666666667,
    "status": "",
    "minutesBalance": 89.0
  },
  {
    "date": "2026-10-09",
    "day": "Friday",
    "timeIn": "10:52",
    "timeOut": "18:22",
    "workingHoursMin": 410.64999999999986,
    "totalTimeMin": 450.23333333333323,
    "status": "",
    "minutesBalance": -70.0
  },
  {
    "date": "2026-10-12",
    "day": "Monday",
    "timeIn": "10:16",
    "timeOut": "21:34",
    "workingHoursMin": 588.883333333333,
    "totalTimeMin": 677.8166666666674,
    "status": "",
    "minutesBalance": 108.0
  },
  {
    "date": "2026-10-13",
    "day": "Tuesday",
    "timeIn": "14:21",
    "timeOut": "14:56",
    "workingHoursMin": 514.7833333333334,
    "totalTimeMin": 34.78333333333334,
    "status": "Sick/Casual Leave",
    "minutesBalance": 34.0
  },
  {
    "date": "2026-10-14",
    "day": "Wednesday",
    "timeIn": "10:45",
    "timeOut": "15:10",
    "workingHoursMin": 475.3500000000004,
    "totalTimeMin": 264.5666666666669,
    "status": "Official Short Day",
    "minutesBalance": -5.0
  },
  {
    "date": "2026-10-15",
    "day": "Thursday",
    "timeIn": "09:13",
    "timeOut": "21:19",
    "workingHoursMin": 494.8833333333341,
    "totalTimeMin": 725.6000000000003,
    "status": "",
    "minutesBalance": 14.0
  },
  {
    "date": "2026-10-16",
    "day": "Friday",
    "timeIn": "09:59",
    "timeOut": "18:03",
    "workingHoursMin": 434.7166666666666,
    "totalTimeMin": 483.75,
    "status": "",
    "minutesBalance": -46.0
  },
  {
    "date": "2026-10-19",
    "day": "Monday",
    "timeIn": "09:29",
    "timeOut": "22:29",
    "workingHoursMin": 693.2499999999998,
    "totalTimeMin": 779.8499999999999,
    "status": "",
    "minutesBalance": 213.0
  },
  {
    "date": "2026-10-20",
    "day": "Tuesday",
    "timeIn": "11:06",
    "timeOut": "21:40",
    "workingHoursMin": 589.6500000000004,
    "totalTimeMin": 633.4666666666661,
    "status": "",
    "minutesBalance": 109.0
  },
  {
    "date": "2026-10-21",
    "day": "Wednesday",
    "timeIn": "10:56",
    "timeOut": "21:13",
    "workingHoursMin": 529.966666666666,
    "totalTimeMin": 616.4666666666669,
    "status": "",
    "minutesBalance": 49.0
  },
  {
    "date": "2026-10-22",
    "day": "Thursday",
    "timeIn": "11:42",
    "timeOut": "19:13",
    "workingHoursMin": 424.01666666666733,
    "totalTimeMin": 451.06666666666706,
    "status": "",
    "minutesBalance": -56.0
  },
  {
    "date": "2026-10-23",
    "day": "Friday",
    "timeIn": "11:23",
    "timeOut": "21:44",
    "workingHoursMin": 532.7333333333338,
    "totalTimeMin": 621.0833333333328,
    "status": "",
    "minutesBalance": 52.0
  },
  {
    "date": "2026-10-26",
    "day": "Monday",
    "timeIn": "11:00",
    "timeOut": "18:36",
    "workingHoursMin": 382.8833333333338,
    "totalTimeMin": 456.5666666666664,
    "status": "",
    "minutesBalance": -98.0
  },
  {
    "date": "2026-10-27",
    "day": "Tuesday",
    "timeIn": "10:53",
    "timeOut": "19:30",
    "workingHoursMin": 459.8500000000003,
    "totalTimeMin": 517.2333333333336,
    "status": "",
    "minutesBalance": -21.0
  },
  {
    "date": "2026-10-28",
    "day": "Wednesday",
    "timeIn": "10:32",
    "timeOut": "17:43",
    "workingHoursMin": 385.40000000000015,
    "totalTimeMin": 430.4499999999998,
    "status": "",
    "minutesBalance": -95.0
  },
  {
    "date": "2026-10-29",
    "day": "Thursday",
    "timeIn": "10:54",
    "timeOut": "19:14",
    "workingHoursMin": 442.03333333333387,
    "totalTimeMin": 500.21666666666636,
    "status": "",
    "minutesBalance": -38.0
  }
];
