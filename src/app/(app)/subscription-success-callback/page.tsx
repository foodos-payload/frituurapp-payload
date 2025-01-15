// File: /src/app/(app)/subscription-success-callback/page.tsx

import React from "react"
import { SubscriptionSuccessCallbackClient } from "./SubscriptionSuccessCallbackClient"

export default function SubscriptionSuccessCallbackPage() {
  // Since this is a Server Component, we do server-side logic if needed,
  // but for this scenario, we'll just render the client component.
  return <SubscriptionSuccessCallbackClient />
}
