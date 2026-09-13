import { redirect } from 'next/navigation'

export default function AdminSettingsPage() {
  // Campus settings removed as redundant; redirected to primary experience management
  redirect('/admin')
}
