import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CollectionsTable } from './collections-table'
import type { CollectionPermission } from './types'

interface Props {
    path: string
    value?: CollectionPermission[]
}

const CollectionsField: React.FC<Props> = async ({ path, value }) => {
    const payload = await getPayload({ config })
    const collectionNames = Object.keys(payload.collections)

    return (
        <CollectionsTable
            collectionNames={collectionNames}
            path={path}
            name={path}
            defaultValue={value}
        />
    )
}

export default CollectionsField