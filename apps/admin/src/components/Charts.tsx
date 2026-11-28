'use client';

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { BOOKING_STATUS_LABELS, formatINRCompact, type DashboardStats } from '@travo/core';

const AXIS = { fontSize: 11, fill: '#6E767C' };
const STATUS_COLORS: Record<string, string> = { pending: '#C48A2C', confirmed: '#2E6B4F', rejected: '#B3412E', cancelled: '#9AA2A8', completed: '#2F5F8A' };

export function EnquiriesChart({ data }: { data: DashboardStats['enquiriesOverTime'] }) {
  const rows = data.map((d) => ({ ...d, label: `${Number(d.date.slice(8))}/${Number(d.date.slice(5, 7))}` }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#EFEBE2" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={4} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E6E1D6', fontSize: 12 }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="bookings" name="Booking requests" stroke="#17382A" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="enquiries" name="Custom enquiries" stroke="#C48A2C" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DestinationsChart({ data }: { data: DashboardStats['popularDestinations'] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
        <CartesianGrid stroke="#EFEBE2" horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: '#1F2326' }} tickLine={false} axisLine={false} width={90} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E6E1D6', fontSize: 12 }} />
        <Bar dataKey="bookings" name="All-time bookings" fill="#2E6B4F" radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusChart({ data }: { data: DashboardStats['bookingsByStatus'] }) {
  const rows = data.filter((d) => d.count > 0).map((d) => ({ ...d, name: BOOKING_STATUS_LABELS[d.status] }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={rows} dataKey="count" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
          {rows.map((r) => (
            <Cell key={r.status} fill={STATUS_COLORS[r.status]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E6E1D6', fontSize: 12 }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PerformanceChart({ data }: { data: DashboardStats['packagePerformance'] }) {
  const rows = data.map((d) => ({ ...d, short: d.title.length > 22 ? `${d.title.slice(0, 21)}…` : d.title }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#EFEBE2" vertical={false} />
        <XAxis dataKey="short" tick={{ ...AXIS, fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #E6E1D6', fontSize: 12 }}
          formatter={(v, name) => (name === 'Request value' ? formatINRCompact(Number(v)) : String(v))}
          labelFormatter={(_, p) => (p?.[0]?.payload as { title?: string } | undefined)?.title ?? ''}
        />
        <Bar dataKey="bookings" name="Bookings" fill="#17382A" radius={[6, 6, 0, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
