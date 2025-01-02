import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SERVER_URL: process.env.SERVER_URL,
  },
  images: {
    domains: [
      'payloadmedia.ams3.cdn.digitaloceanspaces.com', // Add your S3 CDN domain here
    ],
  },
}

export default withPayload(nextConfig)
