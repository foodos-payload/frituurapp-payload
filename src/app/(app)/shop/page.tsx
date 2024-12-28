import { headers } from 'next/headers';
import { ProductGrid } from './components/ProductGrid';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const headersList = headers();
  const fullHost = headersList.get('host') || '';
  const host = fullHost.split('.')[0];

  const response = await fetch(`${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/getProducts?host=${host}`, {
    headers: {
      host: host,
    },
  });

  const data = await response.json();

  // You can toggle between horizontal and vertical categories by changing the prop
  const useVerticalCategories = true; // Adjust based on your desired layout

  return (
    <ProductGrid
      categorizedProducts={data.categorizedProducts || []}
      useVerticalCategories={useVerticalCategories}
    />
  );
}
