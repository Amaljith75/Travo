'use client';

import Link from 'next/link';
import { Building2, Bus, CalendarRange, ClipboardList, Clock, Package, PackageCheck, Ticket } from 'lucide-react';
import { timeAgo } from '@travo/core';
import { useStats } from '@/lib/queries';
import { Card, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { DestinationsChart, EnquiriesChart, PerformanceChart, StatusChart } from '@/components/Charts';

export default function Overview() {
  const q = useStats();
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const s = q.data;
  const tiles = s
    ? [
        { label: 'Total packages', value: s.totalPackages, icon: Package, href: '/packages/' },
        { label: 'Active packages', value: s.activePackages, icon: PackageCheck, href: '/packages/' },
        { label: 'Upcoming trips', value: s.upcomingTrips, icon: CalendarRange, href: '/trips/' },
        { label: 'Total enquiries', value: s.totalEnquiries, icon: ClipboardList, href: '/bookings/' },
        { label: 'Pending requests', value: s.pendingBookings, icon: Clock, href: '/bookings/?status=pending', highlight: s.pendingBookings > 0 },
        { label: 'Confirmed bookings', value: s.confirmedBookings, icon: Ticket, href: '/bookings/?status=confirmed' },
        { label: 'Registered operators', value: s.registeredOperators, icon: Building2, href: '/operators/' },
        { label: 'Listed vehicles', value: s.listedVehicles, icon: Bus, href: '/vehicles/' },
      ]
    : [];
  return (
    <>
      <PageHeader title="Overview" subtitle="Marketplace activity across Kerala" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {!s
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)
          : tiles.map(({ label, value, icon: Icon, href, highlight }) => (
              <Link key={label} href={href} className={`card p-4 transition hover:border-emerald ${highlight ? 'ring-1 ring-gold/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted">{label}</p>
                  <Icon className={`h-4 w-4 ${highlight ? 'text-gold' : 'text-emerald'}`} />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
              </Link>
            ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Enquiries over time · last 30 days" className="lg:col-span-2">
          {s ? <EnquiriesChart data={s.enquiriesOverTime} /> : <Skeleton className="h-60" />}
        </Card>
        <Card title="Booking status">{s ? <StatusChart data={s.bookingsByStatus} /> : <Skeleton className="h-60" />}</Card>
        <Card title="Popular destinations">{s ? <DestinationsChart data={s.popularDestinations} /> : <Skeleton className="h-60" />}</Card>
        <Card title="Package performance" className="lg:col-span-2">
          {s ? <PerformanceChart data={s.packagePerformance} /> : <Skeleton className="h-60" />}
        </Card>
      </div>
      <Card title="Recent activity" className="mt-6" action={<Link href="/bookings/" className="text-xs font-semibold text-emerald">View bookings</Link>}>
        {!s ? (
          <Skeleton className="h-40" />
        ) : (
          <ul className="divide-y divide-line/70">
            {s.recentActivity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                <span>{a.message}</span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
