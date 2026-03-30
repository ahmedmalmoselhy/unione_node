import PDFDocument from 'pdfkit';

const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatIcsDateTime(date) {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(
    date.getUTCHours()
  )}${pad2(date.getUTCMinutes())}00Z`;
}

function formatIcsDate(date) {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}`;
}

function escapeIcsText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function parseSchedule(schedule) {
  if (!schedule) {
    return null;
  }

  if (typeof schedule === 'string') {
    try {
      return JSON.parse(schedule);
    } catch {
      return null;
    }
  }

  return schedule;
}

function firstWeekdayOnOrAfter(baseDate, weekday) {
  const d = new Date(baseDate);
  const delta = (weekday - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

function parseTimeToUtcDate(baseDate, hhmm) {
  const [hours, minutes] = String(hhmm || '00:00')
    .split(':')
    .map((v) => Number(v));

  const d = new Date(baseDate);
  d.setUTCHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return d;
}

export function buildScheduleIcs(scheduleRows, calendarName = 'UniOne Schedule') {
  const now = new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniOne//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  for (const row of scheduleRows) {
    const schedule = parseSchedule(row.section_schedule);
    const days = Array.isArray(schedule?.days) ? schedule.days : [];
    if (!days.length) {
      continue;
    }

    const byday = days
      .map((day) => WEEKDAY_CODES[Number(day)])
      .filter(Boolean)
      .join(',');

    if (!byday) {
      continue;
    }

    const startSource = row.term_starts_at ? new Date(row.term_starts_at) : now;
    const endSource = row.term_ends_at ? new Date(row.term_ends_at) : null;
    const firstDay = firstWeekdayOnOrAfter(startSource, Number(days[0]));
    const dtStart = parseTimeToUtcDate(firstDay, schedule.start_time);
    const dtEnd = parseTimeToUtcDate(firstDay, schedule.end_time);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:section-${row.section_id}@unione.local`);
    lines.push(`DTSTAMP:${formatIcsDateTime(now)}`);
    lines.push(`DTSTART:${formatIcsDateTime(dtStart)}`);
    lines.push(`DTEND:${formatIcsDateTime(dtEnd)}`);
    lines.push(`SUMMARY:${escapeIcsText(`${row.course_code} ${row.course_name}`)}`);
    lines.push(`LOCATION:${escapeIcsText(row.section_room || 'TBA')}`);
    lines.push(`DESCRIPTION:${escapeIcsText(`Professor: ${row.professor_first_name} ${row.professor_last_name}`)}`);

    if (endSource) {
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${formatIcsDate(endSource)}T235959Z`);
    } else {
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byday}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return `${lines.join('\r\n')}\r\n`;
}

export function buildTranscriptPdfBuffer({ student, transcript }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Academic Transcript', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12).text(`Student: ${student.first_name} ${student.last_name}`);
    doc.text(`Student Number: ${student.student_number}`);
    doc.text(`Department: ${student.department_name || 'N/A'}`);
    doc.text(`Faculty: ${student.faculty_name || 'N/A'}`);
    doc.text(`Current GPA: ${transcript.total_gpa}`);
    doc.text(`Earned Credits: ${transcript.earned_credits}`);

    doc.moveDown(1.5);
    doc.fontSize(13).text('Academic History');
    doc.moveDown(0.5);

    for (const item of transcript.academic_history) {
      doc
        .fontSize(10)
        .text(
          `${item.course_code} - ${item.course_name} | Term: ${item.term_name || 'N/A'} | Grade: ${item.letter_grade || '-'} | Total: ${
            item.total ?? '-'
          } | Credits: ${item.credit_hours || 0}`
        );
    }

    doc.end();
  });
}

export default {
  buildScheduleIcs,
  buildTranscriptPdfBuffer,
};
