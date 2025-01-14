import { getPayload } from "payload";
import config from '@payload-config'

import { Service } from "../payload-types";

export async function getServices() {
    const payload = await getPayload({ config })

    try {
        const services = await payload.find({
            collection: 'services',
        });
        return services.docs as Service[];
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
} 