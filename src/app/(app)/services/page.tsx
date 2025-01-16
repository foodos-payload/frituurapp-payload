// File: src/app/services/page.tsx (example)
import { getServices } from '@/lib/services'
import { getUserMe } from '@/utilities/user-me'
import ServicesClient from './ServicesClient'

export default async function ServicesPage() {
    const services = await getServices()     // SSR
    const { user } = await getUserMe()       // SSR
    // You might also want to fetch the user's shops, or check which services they own.
    // But let's pass `services` + `user` to the client component:

    return (
        <ServicesClient services={services} currentUser={user} />
    )
}
