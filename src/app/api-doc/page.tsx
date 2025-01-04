// File: src/app/api-doc/page.tsx
"use client"

import React from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function SwaggerDocPage() {
    return <SwaggerUI url="/api-doc/swagger.json" />
}
