import { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/CalendarView';

export const metadata: Metadata = {
  title: 'Calendrier - ATW Timesheet',
  description: 'Visualisation hebdomadaire des timesheets et créneaux de travail',
};

export default function CalendarPage() {
  return <CalendarView />;
}
