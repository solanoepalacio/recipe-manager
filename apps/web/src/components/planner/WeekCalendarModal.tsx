'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getCalendarGrid, localDateString, getWeekRange } from '@/lib/planner-dates';

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_ABBRS_ES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

interface WeekCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
}

export function WeekCalendarModal({
  isOpen,
  onClose,
  currentDate,
  onSelectDate,
}: WeekCalendarModalProps) {
  const [displayYear, setDisplayYear] = useState(() => currentDate.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(() => currentDate.getMonth());

  const grid = getCalendarGrid(displayYear, displayMonth);

  const today = localDateString(new Date());

  // Compute the week range for currentDate to highlight that row
  const currentWeekRange = getWeekRange(currentDate);
  const currentWeekDays = new Set(currentWeekRange.days);

  function handlePrevMonth() {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((y) => y - 1);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((y) => y + 1);
    } else {
      setDisplayMonth((m) => m + 1);
    }
  }

  function handleDayClick(date: Date) {
    onSelectDate(date);
    onClose();
  }

  const title = `${MONTH_NAMES_ES[displayMonth]} ${displayYear}`;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="px-4 pb-6 overflow-y-auto max-h-[70vh]">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            aria-label="Mes anterior"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-subtle"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>
          <span className="text-[15px] font-semibold text-foreground">{title}</span>
          <button
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-subtle"
          >
            <ChevronRight size={20} className="text-foreground" />
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_ABBRS_ES.map((abbr, i) => (
            <div
              key={i}
              className="text-center text-[12px] font-medium text-secondary py-1"
            >
              {abbr}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {grid.map((week, weekIdx) => {
          // Check if any day in this week is part of the currentDate's week
          const isCurrentWeekRow = week.some((d) => currentWeekDays.has(localDateString(d)));

          return (
            <div
              key={weekIdx}
              className={`grid grid-cols-7 rounded-lg ${isCurrentWeekRow ? 'bg-subtle' : ''}`}
            >
              {week.map((date, dayIdx) => {
                const dateStr = localDateString(date);
                const isCurrentMonth = date.getMonth() === displayMonth;
                const isToday = dateStr === today;

                return (
                  <button
                    key={dayIdx}
                    onClick={() => handleDayClick(date)}
                    aria-label={dateStr}
                    className={[
                      'flex items-center justify-center h-9 w-full text-[14px] transition-colors',
                      isCurrentMonth ? 'text-foreground' : 'text-secondary opacity-40',
                      isToday ? 'ring-2 ring-accent rounded-full font-semibold' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
