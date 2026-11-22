import { useMemo } from 'react';

/**
 * 從去程時間字串推算 Day 1 ~ N 的日期資訊與格式化標籤
 */
export const useDateInference = (flightInTime: string, totalDays: number) => {
  return useMemo(() => {
    const dateMatch = flightInTime.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (!dateMatch) {
      return {
        hasValidStartDate: false,
        startDateIso: '',
        inferredDates: Array.from({ length: totalDays }, (_, i) => `Day ${i + 1}`),
      };
    }

    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const day = parseInt(dateMatch[3], 10);
    const startDate = new Date(year, month - 1, day);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    const inferredDates = Array.from({ length: totalDays }, (_, idx) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + idx);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const w = weekdays[d.getDay()];
      return `${mm}/${dd} (${w})`;
    });

    const startDateIso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      hasValidStartDate: true,
      startDateIso,
      inferredDates,
    };
  }, [flightInTime, totalDays]);
};

