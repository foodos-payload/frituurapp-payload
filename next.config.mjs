import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'payloadmedia.ams3.cdn.digitaloceanspaces.com', // Add your S3 CDN domain here
    ],
  },
}

export default withPayload(nextConfig)
