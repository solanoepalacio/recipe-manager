import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekCalendarModal } from '@/components/planner/WeekCalendarModal';

// Use a fixed reference date: March 19, 2026 (Wednesday)
const REFERENCE_DATE = new Date(2026, 2, 19); // month is 0-indexed

describe('WeekCalendarModal', () => {
  it('renders month name and year in header', () => {
    render(
      <WeekCalendarModal
        isOpen={true}
        onClose={vi.fn()}
        currentDate={REFERENCE_DATE}
        onSelectDate={vi.fn()}
      />
    );
    const marchHeadings = screen.getAllByText('Marzo 2026');
    expect(marchHeadings.length).toBeGreaterThan(0);
  });

  it('renders day-of-week abbreviations', () => {
    render(
      <WeekCalendarModal
        isOpen={true}
        onClose={vi.fn()}
        currentDate={REFERENCE_DATE}
        onSelectDate={vi.fn()}
      />
    );
    // D, L, J, V, S appear once; M appears twice (Martes + Miercoles)
    const dCells = screen.getAllByText('D');
    expect(dCells.length).toBeGreaterThan(0);
    const lCells = screen.getAllByText('L');
    expect(lCells.length).toBeGreaterThan(0);
    const mCells = screen.getAllByText('M');
    expect(mCells.length).toBeGreaterThan(0);
    const jCells = screen.getAllByText('J');
    expect(jCells.length).toBeGreaterThan(0);
    const vCells = screen.getAllByText('V');
    expect(vCells.length).toBeGreaterThan(0);
    const sCells = screen.getAllByText('S');
    expect(sCells.length).toBeGreaterThan(0);
  });

  it('clicking a day calls onSelectDate with correct date', () => {
    const onSelectDate = vi.fn();
    render(
      <WeekCalendarModal
        isOpen={true}
        onClose={vi.fn()}
        currentDate={REFERENCE_DATE}
        onSelectDate={onSelectDate}
      />
    );
    // Click on the 15th of March 2026
    const dayButton = screen.getByRole('button', { name: '2026-03-15' });
    fireEvent.click(dayButton);
    expect(onSelectDate).toHaveBeenCalledOnce();
    const called = onSelectDate.mock.calls[0][0] as Date;
    expect(called.getFullYear()).toBe(2026);
    expect(called.getMonth()).toBe(2); // March
    expect(called.getDate()).toBe(15);
  });

  it('clicking a day calls onClose', () => {
    const onClose = vi.fn();
    render(
      <WeekCalendarModal
        isOpen={true}
        onClose={onClose}
        currentDate={REFERENCE_DATE}
        onSelectDate={vi.fn()}
      />
    );
    const dayButton = screen.getByRole('button', { name: '2026-03-10' });
    fireEvent.click(dayButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prev month button changes displayed month to February 2026', () => {
    render(
      <WeekCalendarModal
        isOpen={true}
        onClose={vi.fn()}
        currentDate={REFERENCE_DATE}
        onSelectDate={vi.fn()}
      />
    );
    const prevButton = screen.getByRole('button', { name: 'Mes anterior' });
    fireEvent.click(prevButton);
    const febHeadings = screen.getAllByText('Febrero 2026');
    expect(febHeadings.length).toBeGreaterThan(0);
  });

  it('next month button changes displayed month to April 2026', () => {
    render(
      <WeekCalendarModal
        isOpen={true}
        onClose={vi.fn()}
        currentDate={REFERENCE_DATE}
        onSelectDate={vi.fn()}
      />
    );
    const nextButton = screen.getByRole('button', { name: 'Mes siguiente' });
    fireEvent.click(nextButton);
    const aprHeadings = screen.getAllByText('Abril 2026');
    expect(aprHeadings.length).toBeGreaterThan(0);
  });

  it('does not render when isOpen=false', () => {
    render(
      <WeekCalendarModal
        isOpen={false}
        onClose={vi.fn()}
        currentDate={REFERENCE_DATE}
        onSelectDate={vi.fn()}
      />
    );
    expect(screen.queryByText('Marzo 2026')).toBeNull();
  });
});
