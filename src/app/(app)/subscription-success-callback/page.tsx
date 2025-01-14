import React from 'react'
import { getPayload } from 'payload';
import config from '@payload-config'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Params } from 'next/dist/server/request/params';
import { User } from '@/payload-types'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const SubscriptionSuccessCallback = async (props: {
  params: Params
  searchParams: SearchParams
}) => {
  const { searchParams } = props
  const payload = await getPayload({ config })

  const { service_id, user_id, amount, role } = await searchParams
  let user: User | null = null;
  try {
    user = await payload.findByID({
      collection: 'users',
      id: user_id as string,
    })
  } catch (error) {
    console.error('Error finding user:', error)
  }
  if (user) {
    try {
      // Check if the role already exists in user's roles
      const hasRole = user.roles?.some(existingRole =>
        typeof existingRole !== 'string' && existingRole.id === role
      )

      await payload.update({
        collection: 'users',
        id: user_id as string,
        data: {
          service: service_id as string,
          status: 'active',
          subscription_amount: Number(amount),
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          subscription_currency: 'EUR',
          // Only add the role if it doesn't exist
          roles: hasRole ? user.roles : [...(user.roles || []), { id: role as string }],
          transactions: [
            ...(user.transactions || []),
            {
              amount: Number(amount) as number,
              currency: 'EUR',
              date: new Date().toISOString(),
              status: 'success' as const,
              service: service_id as string,
            }
          ]
        },
      })
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h1 className="text-2xl font-semibold text-gray-900">Subscription Successful!</h1>
          <p className="text-gray-600">
            Thank you for your subscription. Your account has been successfully updated.
          </p>
          <Button asChild className="mt-6">
            <Link href="/services">
              Return to Services
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default SubscriptionSuccessCallback
