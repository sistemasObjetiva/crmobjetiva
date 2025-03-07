import React, { useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import "../styles/Calendar.css";
import DayModal from "../components/DayModal";
import  {  isSameDate }  from "../hooks/useDateUtils";
import { Event } from "../types/types";

interface CalendarProps {
  events?: Event[];
}

const Calendar: React.FC<CalendarProps> = ({ events = [] }) => {
  
  const [currentMonth, setCurrentMonth] = useState(Temporal.Now.plainDateISO());
  const [selectedDate, setSelectedDate] = useState<Temporal.PlainDate | null>(null);
  const [isModalDayOpen, setModalDayOpen] = useState<boolean>(false);

  const openDayModal = (date: Temporal.PlainDate) => {
    setSelectedDate(date);
    setModalDayOpen(true);
  };

  const closeModal = () => {
    setModalDayOpen(false);
    setSelectedDate(null);
  };

  const renderDays = (): React.ReactNode => {
    const startDate = Temporal.PlainDate.from({
      year: currentMonth.year,
      month: currentMonth.month,
      day: 1,
    });

    const endDate = startDate.add({ months: 1 }).subtract({ days: 1 });
    const rows: React.ReactNode[] = [];
    let days: React.ReactNode[] = [];
    let currentDay = startDate;

    while (Temporal.PlainDate.compare(currentDay, endDate) <= 0) {
      for (let i = 0; i < 7; i++) {
        const dayCopy = currentDay;
        const isToday = Temporal.PlainDate.compare(
          dayCopy,
          Temporal.Now.plainDateISO()
        ) === 0;
        const isInCurrentMonth = dayCopy.month === currentMonth.month;

        const hasEvent = events.some((event) =>
          isSameDate(Temporal.PlainDate.from(event.fecha), dayCopy)
        );

        days.push(
          <div
            key={dayCopy.toString()}
            className={`day ${isInCurrentMonth ? "" : "disabled"} ${
              isToday ? "today" : ""
            } ${hasEvent ? "event-day" : ""}`}
            onClick={() => openDayModal(dayCopy)}
          >
            <span>{dayCopy.day}</span>
            {hasEvent && <span className="event-marker"></span>}
          </div>
        );

        currentDay = currentDay.add({ days: 1 });
      }
      rows.push(
        <div className="week" key={currentDay.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="days">{rows}</div>;
  };

  return (
    <>
      <div className="calendar">
        <div className="header">
          <button onClick={() => setCurrentMonth(currentMonth.subtract({ months: 1 }))}>
            ⬅️
          </button>
          <h2>{`${currentMonth.month}/${currentMonth.year}`}</h2>
          <button onClick={() => setCurrentMonth(currentMonth.add({ months: 1 }))}>
            ➡️
          </button>
        </div>
        <div className="weekdays">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div className="weekday" key={day}>
              {day}
            </div>
          ))}
        </div>
        {renderDays()}
      </div>

      {selectedDate && (
        <DayModal
          open={isModalDayOpen}
          onClose={closeModal}
          date={selectedDate}
          seguimientos={[]} // Se omiten los seguimientos por el momento
        />
      )}
    </>
  );
};

export default Calendar;
