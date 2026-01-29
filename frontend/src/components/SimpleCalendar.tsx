'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const calendarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Calculate dropdown position for portal (absolute viewport coordinates)
  useEffect(() => {
    if (isOpen && calendarRef.current) {
      const updatePosition = () => {
        if (calendarRef.current) {
          const rect = calendarRef.current.getBoundingClientRect();
          const dropdownHeight = 350; // Approximate calendar height
          const dropdownWidth = 280; // Calendar width
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          let top = rect.bottom + 4; // Position below input
          let left = rect.left; // Align with left edge
          
          // Check if there's enough space below
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          // Position above if not enough space below
          if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
            top = rect.top - dropdownHeight - 4; // Position above input
          }
          
          // Adjust horizontal position to stay within viewport
          const spaceRight = viewportWidth - rect.left;
          const spaceLeft = rect.left;
          
          if (spaceRight < dropdownWidth && spaceLeft > dropdownWidth) {
            // Position to the left
            left = rect.right - dropdownWidth;
          } else if (spaceRight < dropdownWidth) {
            // Adjust to fit on the right - shift left
            left = viewportWidth - dropdownWidth - 16;
          }
          
          // Ensure calendar stays within viewport bounds
          top = Math.max(16, Math.min(top, viewportHeight - dropdownHeight - 16));
          left = Math.max(16, Math.min(left, viewportWidth - dropdownWidth - 16));
          
          setPortalPosition({ top, left });
        }
      };
      
      // Use setTimeout to ensure DOM is updated after state change
      const timeoutId = setTimeout(updatePosition, 0);
      
      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        calendarRef.current && 
        !calendarRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setShowYearPicker(false);
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

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setShowYearPicker(false);
  };

  // Generate year range (1900 to current year + 10)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 1900; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years.reverse(); // Most recent first
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
    <div className="relative calendar-wrapper" ref={calendarRef} style={{ position: 'relative', zIndex: 9999, overflow: 'visible' }}>
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
          background: 'rgba(255, 255, 255, 0.06)',
          border: isOpen ? '1px solid rgba(0, 194, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: displayValue ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 1px rgba(0, 194, 255, 0.3)' : 'none',
          transition: 'all 0.2s ease',
        }}
      />
      {isOpen && typeof window !== 'undefined' && createPortal(
        (
        <div 
            ref={dropdownRef}
            className="fixed min-w-[280px]"
          style={{
              background: 'rgba(17, 17, 17, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 99999,
              position: 'fixed',
              top: `${portalPosition.top}px`,
              left: `${portalPosition.left}px`,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 32px)',
              overflow: 'auto'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              style={{
                padding: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ChevronLeftIcon className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 194, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.3)';
                  e.currentTarget.style.color = '#00C2FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                }}
              >
                {currentMonth.getFullYear()}
              </button>
              <h3 style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600', fontSize: '14px' }}>
                {MONTHS[currentMonth.getMonth()]}
            </h3>
            </div>
            <button
              onClick={handleNextMonth}
              style={{
                padding: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <ChevronRightIcon className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
            </button>
          </div>

          {/* Year Picker Dropdown */}
          {showYearPicker && (
            <div
              style={{
                position: 'absolute',
                top: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(17, 17, 17, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                zIndex: 10000,
                minWidth: '120px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {generateYears().map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'center',
                    background: year === currentMonth.getFullYear() ? 'rgba(0, 194, 255, 0.15)' : 'transparent',
                    border: year === currentMonth.getFullYear() ? '1px solid rgba(0, 194, 255, 0.3)' : 'none',
                    borderRadius: '8px',
                    color: year === currentMonth.getFullYear() ? '#00C2FF' : 'rgba(255, 255, 255, 0.75)',
                    fontSize: '13px',
                    fontWeight: year === currentMonth.getFullYear() ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (year !== currentMonth.getFullYear()) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (year !== currentMonth.getFullYear()) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                    }
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div 
                key={day} 
                className="text-center py-1"
                style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', fontWeight: '500' }}
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
                  color: isSelected(day) ? '#000000' : day ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                  fontWeight: isSelected(day) ? '600' : '400',
                  cursor: day ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (day && !isSelected(day)) {
                    e.currentTarget.style.background = 'rgba(0, 194, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (day && !isSelected(day)) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = isToday(day) ? 'rgba(0, 194, 255, 0.4)' : 'transparent';
                  }
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      ),
      document.body
      )}
    </div>
  );
}

