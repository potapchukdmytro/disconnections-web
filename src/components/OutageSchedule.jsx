import React, { useEffect, useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import "./OutageSchedule.css";
import axios from "axios";
import { env } from "./../env";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Усі можливі черги
const QUEUES = [
    "1.1",
    "1.2",
    "2.1",
    "2.2",
    "3.1",
    "3.2",
    "4.1",
    "4.2",
    "5.1",
    "5.2",
    "6.1",
    "6.2",
];

// Демо-розклад: для кожної черги — масив годин, коли світла НЕМАЄ (сьогодні)
// У реальному застосунку це приходить з API
const SCHEDULE_BY_QUEUE = {
    1.1: [],
    1.2: [],
    2.1: [],
    2.2: [],
    3.1: [],
    3.2: [],
    4.1: [],
    4.2: [],
    5.1: [],
    5.2: [],
    6.1: [],
    6.2: [],
};

export default function OutageSchedule() {
    const [queue, setQueue] = useState("1.1");
    const [scheduleQueue, setScheduleQueue] = useState(SCHEDULE_BY_QUEUE);
    const currentHour = new Date().getHours();

    const hoursOff = useMemo(() => scheduleQueue[queue] || [], [queue]);

    useEffect(() => {
        const fetch = async () => {
            try {              
                const response = await axios.get(env.apiUrl + "api/info/disconnections");
                const {data} = response;
                const scheduleApi = {};
                
                for(const item of data) {
                  scheduleApi[item.subQueue] = item.hours.map(h => parseInt(h))
                }

                setScheduleQueue(scheduleApi);
            } catch (error) {
                console.log(error);
            }
        };
        fetch();
    }, []);

    const isNowOff = hoursOff.includes(currentHour);
    const nextOutageHour = hoursOff.find((h) => h > currentHour);
    const currentStatus = isNowOff ? "off" : "on";

    // Групуємо послідовні години у "вікна" відключень
    const outageWindows = useMemo(() => {
        const sorted = [...hoursOff].sort((a, b) => a - b);
        const windows = [];
        let start = null;
        let prev = null;

        for (const h of sorted) {
            if (start === null) {
                start = h;
            } else if (h !== prev + 1) {
                windows.push({ from: start, to: prev + 1 });
                start = h;
            }
            prev = h;
        }
        if (start !== null) windows.push({ from: start, to: prev + 1 });

        return windows;
    }, [hoursOff]);

    return (
        <section className="schedule">
            {/* ==== Вибір черги ==== */}
            <div className="queue-picker">
                <label className="queue-picker__label">Ваша черга:</label>
                <div className="queue-picker__grid">
                    {QUEUES.map((q) => (
                        <button
                            key={q}
                            className={`queue-btn ${queue === q ? "queue-btn--active" : ""}`}
                            onClick={() => setQueue(q)}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* ==== Статус ==== */}
            <div className={`status-panel status-panel--${currentStatus}`}>
                <div className="status-panel__icon">
                    {currentStatus === "on" ? "💡" : "🔌"}
                </div>
                <div className="status-panel__text">
                    <h2>
                        {currentStatus === "on" ? "Світло є" : "Світла немає"}
                        <span className="status-panel__queue">
                            {" "}
                            · Черга {queue}
                        </span>
                    </h2>
                    <p>
                        {isNowOff
                            ? `Відключення орієнтовно до ${String(currentHour + 1).padStart(2, "0")}:00`
                            : nextOutageHour !== undefined
                              ? `Наступне відключення о ${String(nextOutageHour).padStart(2, "0")}:00`
                              : "Сьогодні відключень більше не очікується"}
                    </p>
                </div>
            </div>

            {/* ==== Сітка годин ==== */}
            <div className="schedule-card">
                <div className="schedule-card__header">
                    <h3>Погодинний графік на сьогодні</h3>
                    <StatusBadge
                        color={currentStatus === "on" ? "#27ae60" : "#e74c3c"}
                        label={
                            currentStatus === "on"
                                ? "Зараз: світло є"
                                : "Зараз: відключення"
                        }
                    />
                </div>

                <div className="hours-grid">
                    {HOURS.map((hour) => {
                        const off = hoursOff.includes(hour);
                        const isNow = hour === currentHour;
                        return (
                            <div
                                key={hour}
                                className={`hour-cell ${off ? "hour-cell--off" : "hour-cell--on"} ${
                                    isNow ? "hour-cell--now" : ""
                                }`}
                                title={`${String(hour).padStart(2, "0")}:00 – ${String(hour + 1).padStart(2, "0")}:00 · ${
                                    off ? "відключення" : "світло є"
                                }`}
                            >
                                <span className="hour-cell__time">
                                    {String(hour).padStart(2, "0")}
                                </span>
                                <span className="hour-cell__dot" />
                            </div>
                        );
                    })}
                </div>

                <div className="legend">
                    <div className="legend__item">
                        <span className="legend__swatch legend__swatch--on" />{" "}
                        Світло є
                    </div>
                    <div className="legend__item">
                        <span className="legend__swatch legend__swatch--off" />{" "}
                        Відключення
                    </div>
                    <div className="legend__item">
                        <span className="legend__swatch legend__swatch--now" />{" "}
                        Поточна година
                    </div>
                </div>
            </div>

            {/* ==== Вікна відключень ==== */}
            <div className="info-panel">
                <h4>⏰ Вікна відключень для черги {queue} сьогодні</h4>
                {outageWindows.length === 0 ? (
                    <p className="info-panel__empty">
                        Відключень за графіком не передбачено 🎉
                    </p>
                ) : (
                    <ul className="info-panel__list">
                        {outageWindows.map((w) => {
                            const isActive =
                                currentHour >= w.from && currentHour < w.to;
                            const isPast = w.to <= currentHour;
                            return (
                                <li
                                    key={`${w.from}-${w.to}`}
                                    className={`info-panel__item ${isPast ? "info-panel__item--past" : ""} ${
                                        isActive
                                            ? "info-panel__item--active"
                                            : ""
                                    }`}
                                >
                                    <span className="info-panel__time">
                                        {String(w.from).padStart(2, "0")}:00 –{" "}
                                        {String(w.to).padStart(2, "0")}:00
                                    </span>
                                    {isActive && (
                                        <StatusBadge
                                            color="#e74c3c"
                                            label="Зараз"
                                        />
                                    )}
                                    {isPast && (
                                        <span className="info-panel__past-label">
                                            завершено
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}
