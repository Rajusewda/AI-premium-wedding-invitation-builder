import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WeddingInvitation } from '@/components/wedding-invitation'
import { publicWeddings } from '@/lib/seed'
import { coupleNames, formatDate } from '@/lib/wedding'

// Until a database is connected, only built-in published weddings can be served here.
// Weddings created in the builder exist only in the builder's browser session.
type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return publicWeddings.map((w) => ({ slug: w.slug }))
}
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wedding = publicWeddings.find((w) => w.slug === slug)
  if (!wedding) return {}
  return { title: `${coupleNames(wedding)} | Wedding Invitation`, description: `${coupleNames(wedding)} — ${formatDate(wedding.date)}.` }
}

export default async function WeddingPage({ params }: Props) {
  const { slug } = await params
  const wedding = publicWeddings.find((w) => w.slug === slug)
  if (!wedding) notFound()
  return <WeddingInvitation wedding={wedding} mode="public" />
}
