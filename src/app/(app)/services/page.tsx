import { getServices } from '@/lib/services'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Media, Service } from '@/payload-types'
import Image from 'next/image'
import { SubscribeButton } from '@/components/ui/subscribe-button'

export default async function Services() {
    const services = await getServices() as Service[]

    return (
        <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Choose the right plan for&nbsp;you
                    </p>
                </div>
                <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:mt-20 lg:grid-cols-3 lg:gap-8">
                    {services.map((service) => {
                        const thumbnail = service.service_thumbnail as Media
                        return (
                            <Card key={service.id} className="flex flex-col rounded-xl">
                                <CardHeader>
                                    <Image src={thumbnail.url || ''} alt={service.title_nl} width={400} height={400} />
                                    <CardTitle className="text-2xl font-bold">{service.title_nl}</CardTitle>
                                    <CardDescription>
                                        <div className="mt-6 flex items-baseline gap-x-2">
                                            <span className="text-4xl font-bold tracking-tight text-gray-900">
                                                €{service.monthly_price}
                                            </span>
                                            <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="flex flex-col gap-3">
                                    <SubscribeButton
                                        priceId={service.stripe_monthly_price_id || ''}
                                        variant="default"
                                    >
                                        Subscribe Monthly
                                    </SubscribeButton>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
