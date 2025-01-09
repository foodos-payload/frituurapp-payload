import React from 'react'
import CollectionsTable from './collections-table'

const CollectionsField = async ({ payload, doc }: { payload: any, doc: any }) => {
    const collectionNames = Object.keys(payload.collections)
    return (
        <CollectionsTable collectionNames={collectionNames} doc={doc} />
    )
}

export default CollectionsField