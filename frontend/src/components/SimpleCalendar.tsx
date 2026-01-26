'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SimpleCalendarProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  maxLength?: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SimpleCalendar({ value, onChange, placeholder = 'Select date' }: SimpleCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === 'undefined' || dateStr === 'null') return null;
    try {
      const date = new Date(dateStr + 'T00:00:00');
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      return date;
    } catch {
      return null;
    }
  };

  // Parse current value
  const selectedDate = value ? parseDate(value) : null;
  
  // Initialize current month based on selected date or today
  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      if (parsed && !isNaN(parsed.getTime())) {
        setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    } else {
      // Initialize with current month if no value
      const today = new Date();
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSelected = (day: number | null): boolean => {
    if (!day || !selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const displayValue = selectedDate && !isNaN(selectedDate.getTime())
    ? `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
    : '';

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative calendar-wrapper" ref={calendarRef}>
      <input
        type="text"
        readOnly
        value={displayValue}
        placeholder={placeholder}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: isOpen ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          color: '#FFFFFF',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 1px rgba(0, 194, 255, 0.3)' : 'none',
          transition: 'all 0.2s ease',
        }}
      />
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 z-50 min-w-[280px]"
          style={{
            background: 'rgba(30, 30, 30, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              style={{
                padding: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <ChevronLeftIcon className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            </button>
            <h3 style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '14px' }}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              style={{
                padding: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <ChevronRightIcon className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div 
                key={day} 
                className="text-center py-1"
                style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: '500' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day && handleDateClick(day)}
                disabled={!day}
                style={{
                  width: '36px',
                  height: '36px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: isToday(day) && !isSelected(day) ? '1px solid rgba(0, 194, 255, 0.4)' : 'none',
                  background: isSelected(day) ? '#00C2FF' : 'transparent',
                  color: isSelected(day) ? '#000' : day ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
                  fontWeight: isSelected(day) ? '600' : '400',
                  cursor: day ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (day && !isSelected(day)) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (day && !isSelected(day)) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

