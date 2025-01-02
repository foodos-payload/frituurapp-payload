import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // 1. Create Admin Users for each tenant
  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@payloadcms.com',
      password: 'demo',
      roles: ['super-admin'],
    },
  });

  const tenant1 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 1',
      slug: 'tenant-1',
      domains: [{ domain: 'tenant1.localhost:3000' }],
    },
  });

  const tenant2 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 2',
      slug: 'tenant-2',
      domains: [{ domain: 'tenant2.localhost:3000' }],
    },
  });

  const tenant3 = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Tenant 3',
      slug: 'tenant-3',
      domains: [{ domain: 'tenant3.localhost:3000' }],
    },
  });

  await payload.create({
    collection: 'users',
    data: {
      email: 'tenant1@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant1.id,
        },
      ],
      username: 'tenant1',
    },
  });

  await payload.create({
    collection: 'users',
    data: {
      email: 'tenant2@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant2.id,
        },
      ],
      username: 'tenant2',
    },
  });

  await payload.create({
    collection: 'users',
    data: {
      email: 'tenant3@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant3.id,
        },
      ],
      username: 'tenant3',
    },
  });

  await payload.create({
    collection: 'users',
    data: {
      email: 'multi-admin@payloadcms.com',
      password: 'test',
      tenants: [
        {
          roles: ['tenant-admin'],
          tenant: tenant1.id,
        },
        {
          roles: ['tenant-admin'],
          tenant: tenant2.id,
        },
        {
          roles: ['tenant-admin'],
          tenant: tenant3.id,
        },
      ],
      username: 'tenant3',
    },
  });

  await payload.create({
    collection: 'pages',
    data: {
      slug: 'home',
      tenant: tenant1.id,
      title: 'Page for Tenant 1',
    },
  });

  await payload.create({
    collection: 'pages',
    data: {
      slug: 'home',
      tenant: tenant2.id,
      title: 'Page for Tenant 2',
    },
  });

  await payload.create({
    collection: 'pages',
    data: {
      slug: 'home',
      tenant: tenant3.id,
      title: 'Page for Tenant 3',
    },
  });

  //
  // 2. Create One Shop for Tenant 1
  //
  const shop1 = await payload.create({
    collection: 'shops',
    data: {
      tenant: tenant1.id,
      domain: 'tenant1-frituur.localhost:3000',
      name: 'Frituur Den Overkant',
      slug: 'frituur-den-overkant',
      address: 'Street 123, 9000 Gent, Belgium',
      phone: '+32 9 123 45 67',
      company_details: {
        company_name: 'Frituur Den Overkant BV',
        street: 'Street',
        house_number: '123',
        city: 'Gent',
        postal: '9000',
        vat_nr: 'BE0123456789',
        website_url: 'https://frituur-example.com',
      },
      exceptionally_closed_days: [
        {
          date: '2025-12-25',
          reason: 'Christmas',
        },
      ],
    },
  });

  //
  // 3. Create some Product Popups (Tenant 1, Shop 1)
  //

  // Popup 1: Sauce popup (single-select)
  const saucePopup = await payload.create({
    collection: 'productpopups',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      popup_title_nl: 'Kies je saus',
      multiselect: false,
      required_option_cashregister: false,
      required_option_webshop: true,
      minimum_option: 1,
      maximum_option: 1,
    },
  });

  // Popup 2: Burger extras (multi-select)
  const burgerPopup = await payload.create({
    collection: 'productpopups',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      popup_title_nl: 'Bicky Burger opties',
      multiselect: true,
      required_option_cashregister: false,
      required_option_webshop: false,
      minimum_option: 0,
      maximum_option: 3,
    },
  });

  // Popup 3: Drinks (single-select, just an example)
  const drinksPopup = await payload.create({
    collection: 'productpopups',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      popup_title_nl: 'Kies je drankje',
      multiselect: false,
      required_option_cashregister: false,
      required_option_webshop: false,
      minimum_option: 0,
      maximum_option: 1,
    },
  });

  //
  // 4. Create Some SubProducts (sauces, toppings, drinks, etc.)
  //
  const mayo = await payload.create({
    collection: 'subproducts',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Mayonaise',
      price_unified: true,
      price: 0.5,
      tax: 6,
      tax_table: 12,
      status: 'enabled',
    },
  });

  const ketchup = await payload.create({
    collection: 'subproducts',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Ketchup',
      price_unified: true,
      price: 0.5,
      tax: 6,
      tax_table: 12,
      status: 'enabled',
    },
  });

  const samurai = await payload.create({
    collection: 'subproducts',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Samurai',
      price_unified: true,
      price: 0.7,
      tax: 6,
      tax_table: 12,
      status: 'enabled',
    },
  });

  const cheddar = await payload.create({
    collection: 'subproducts',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Cheddar Kaas',
      price_unified: true,
      price: 1.0,
      tax: 6,
      tax_table: 12,
      status: 'enabled',
    },
  });

  // Drinks
  const cocaCola = await payload.create({
    collection: 'subproducts',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Coca Cola',
      price_unified: true,
      price: 1.5,
      tax: 6,
      tax_table: 12,
      status: 'enabled',
    },
  });
  const fanta = await payload.create({
    collection: 'subproducts',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Fanta',
      price_unified: true,
      price: 1.5,
      tax: 6,
      tax_table: 12,
      status: 'enabled',
    },
  });
  const spaBlauw = await payload.create({
    collection: 'subproducts',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Spa Blauw',
      price_unified: true,
      price: 1.0,
      tax: 6,
      tax_table: 12,
      status: 'enabled',
    },
  });

  // Attach subproducts to the popups
  // saucePopup -> mayo, ketchup, samurai
  await payload.update({
    collection: 'productpopups',
    id: saucePopup.id,
    data: {
      subproducts: [mayo.id, ketchup.id, samurai.id],
      default_checked_subproduct: mayo.id,
    },
  });
  // burgerPopup -> cheddar, mayo, ketchup
  await payload.update({
    collection: 'productpopups',
    id: burgerPopup.id,
    data: {
      subproducts: [cheddar.id, mayo.id, ketchup.id],
    },
  });
  // drinksPopup -> cocaCola, fanta, spaBlauw
  await payload.update({
    collection: 'productpopups',
    id: drinksPopup.id,
    data: {
      subproducts: [cocaCola.id, fanta.id, spaBlauw.id],
    },
  });

  //
  // 5. Create Some Categories
  //
  const catFries = await payload.create({
    collection: 'categories',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Frieten',
      status: 'enabled',
      // Example: we can apply sauce popup to the entire category
      productpopups: [
        {
          popup: saucePopup.id,
          order: 1,
        },
      ],
    },
  });

  const catSnacks = await payload.create({
    collection: 'categories',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Snacks',
      status: 'enabled',
    },
  });

  const catBurgers = await payload.create({
    collection: 'categories',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Burgers',
      status: 'enabled',
      productpopups: [
        {
          popup: burgerPopup.id,
          order: 1,
        },
        {
          popup: drinksPopup.id,
          order: 2, // So we can test multi-step
        },
      ],
    },
  });

  const catSauzen = await payload.create({
    collection: 'categories',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Sauzen (los)',
      status: 'enabled',
    },
  });

  const catPizza = await payload.create({
    collection: 'categories',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Pizza',
      status: 'enabled',
      productpopups: [
        {
          popup: drinksPopup.id,
          order: 2,
        },
      ],
    },
  });

  const catDesserts = await payload.create({
    collection: 'categories',
    data: {
      tenant: tenant1.id,
      shops: [shop1.id],
      name_nl: 'Desserts',
      status: 'enabled',
    },
  });

  //
  // 6. Create ~10 products per category. We already have ~5, let's add ~5 more in each.
  //

  // 6.1 FRIES
  const friesNames = [
    { nl: 'Kleine Friet', price: 2.5 },
    { nl: 'Middel Friet', price: 3.0 },
    { nl: 'Grote Friet', price: 3.5 },
    { nl: 'Familypack Friet', price: 5.0 },
    { nl: 'Friet Speciaal', price: 4.0 },
    // Additional fries
    { nl: 'Friet Stoofvlees', price: 5.5 },
    { nl: 'Friet Andalouse', price: 3.7 },
    { nl: 'Twister Fries', price: 4.2 },
    { nl: 'Zoete Aardappel Friet', price: 4.5 },
    { nl: 'XXL Friet', price: 5.5 },
  ];

  for (const fn of friesNames) {
    await payload.create({
      collection: 'products',
      data: {
        tenant: tenant1.id,
        shops: [shop1.id],
        categories: [catFries.id],
        name_nl: fn.nl,
        price_unified: true,
        price: fn.price,
        tax: 6, // just example
        tax_dinein: 12,
        webshopshow: true,
        webshoporderable: true,
        status: 'enabled',
        description_nl: `${fn.nl} - lekker vers.`,
      },
    });
  }

  // 6.2 SNACKS
  const snackNames = [
    { nl: 'Bitterballen (6st)', price: 3.0 },
    { nl: 'Bamischijf', price: 2.0 },
    { nl: 'KaasKroket', price: 2.2 },
    { nl: 'Vleeskroket', price: 2.2 },
    { nl: 'Frikandel', price: 2.0 },
    { nl: 'Mexicano', price: 2.5 },
    // Additional snacks
    { nl: 'Goulashkroket', price: 2.2 },
    { nl: 'Sitostick', price: 2.8 },
    { nl: 'Chicken Nuggets (6st)', price: 3.5 },
    { nl: 'Viandel', price: 2.2 },
  ];

  for (const sn of snackNames) {
    await payload.create({
      collection: 'products',
      data: {
        tenant: tenant1.id,
        shops: [shop1.id],
        categories: [catSnacks.id],
        name_nl: sn.nl,
        price_unified: true,
        price: sn.price,
        tax: 6,
        tax_dinein: 12,
        webshopshow: true,
        webshoporderable: true,
        status: 'enabled',
        description_nl: `Heerlijk snack: ${sn.nl}`,
      },
    });
  }

  // 6.3 BURGERS
  // We will also demonstrate `exclude_category_popups` for one product
  const burgerNames = [
    { nl: 'Bicky Burger', price: 3.0 },
    { nl: 'Cheeseburger', price: 3.5 },
    // We'll make "Double Cheeseburger" exclude category popups
    { nl: 'Double Cheeseburger', price: 5.0, excludeCategoryPopups: true },
    { nl: 'Veggie Burger', price: 4.0 },
    { nl: 'Chicken Burger', price: 3.5 },
    // Additional burgers
    { nl: 'Fish Burger', price: 3.5 },
    { nl: 'Spicy Bicky Burger', price: 3.5 },
    { nl: 'Gourmet Burger', price: 6.0 },
    { nl: 'Junior Cheeseburger', price: 2.8 },
    { nl: 'Vegan Burger', price: 4.5 },
  ];

  for (const b of burgerNames) {
    await payload.create({
      collection: 'products',
      data: {
        tenant: tenant1.id,
        shops: [shop1.id],
        categories: [catBurgers.id],
        name_nl: b.nl,
        exclude_category_popups: b.excludeCategoryPopups || false,
        price_unified: true,
        price: b.price,
        tax: 6,
        tax_dinein: 12,
        webshopshow: true,
        webshoporderable: true,
        status: 'enabled',
        description_nl: `Smakelijke burger: ${b.nl}`,
      },
    });
  }

  // 6.4 SAUZEN (los)
  const sauceItems = [
    { nl: 'Mayonaise (potje)', price: 1.0 },
    { nl: 'Ketchup (potje)', price: 1.0 },
    { nl: 'Curry (potje)', price: 1.0 },
    { nl: 'Samurai (potje)', price: 1.2 },
    { nl: 'Andalouse (potje)', price: 1.2 },
    // Additional
    { nl: 'Tartare (potje)', price: 1.3 },
    { nl: 'Cocktail (potje)', price: 1.3 },
    { nl: 'Bicky Saus (potje)', price: 1.4 },
    { nl: 'Looksaus (potje)', price: 1.4 },
    { nl: 'Pickles (potje)', price: 1.0 },
  ];

  for (const s of sauceItems) {
    await payload.create({
      collection: 'products',
      data: {
        tenant: tenant1.id,
        shops: [shop1.id],
        categories: [catSauzen.id],
        name_nl: s.nl,
        price_unified: true,
        price: s.price,
        tax: 6,
        tax_dinein: 12,
        webshopshow: true,
        webshoporderable: true,
        status: 'enabled',
        description_nl: `${s.nl} - los`,
      },
    });
  }

  // 6.5 PIZZA
  const pizzaNames = [
    { nl: 'Pizza Margherita', price: 8.0 },
    { nl: 'Pizza Hawaï', price: 9.0 },
    { nl: 'Pizza Pepperoni', price: 9.5 },
    { nl: 'Pizza 4 Kazen', price: 10.0 },
    { nl: 'Pizza BBQ Chicken', price: 10.0 },
    // Additional pizzas
    { nl: 'Pizza Funghi', price: 9.0 },
    { nl: 'Pizza Prosciutto', price: 9.5 },
    { nl: 'Calzone (Folded Pizza)', price: 10.5 },
    { nl: 'Pizza Salami', price: 9.5 },
    { nl: 'Pizza Tonno', price: 10.0 },
  ];

  for (const p of pizzaNames) {
    await payload.create({
      collection: 'products',
      data: {
        tenant: tenant1.id,
        shops: [shop1.id],
        categories: [catPizza.id],
        name_nl: p.nl,
        price_unified: true,
        price: p.price,
        tax: 6,
        tax_dinein: 12,
        webshopshow: true,
        webshoporderable: true,
        status: 'enabled',
        description_nl: `Lekkere ${p.nl}`,
      },
    });
  }

  // 6.6 DESSERTS
  const dessertNames = [
    { nl: 'Dame Blanche', price: 3.0 },
    { nl: 'Chocolademousse', price: 3.5 },
    { nl: 'Tiramisu', price: 4.0 },
    { nl: 'Vanille-ijs (bakje)', price: 2.5 },
    { nl: 'Pannenkoek met Suiker', price: 3.0 },
    // Additional desserts
    { nl: 'Wafel met Slagroom', price: 3.5 },
    { nl: 'Crème Brûlée', price: 4.5 },
    { nl: 'Appeltaart', price: 3.5 },
    { nl: 'Moelleux au Chocolat', price: 4.5 },
    { nl: 'Stracciatella IJs (bakje)', price: 3.0 },
  ];

  for (const d of dessertNames) {
    await payload.create({
      collection: 'products',
      data: {
        tenant: tenant1.id,
        shops: [shop1.id],
        categories: [catDesserts.id],
        name_nl: d.nl,
        price_unified: true,
        price: d.price,
        tax: 6,
        tax_dinein: 12,
        webshopshow: true,
        webshoporderable: true,
        status: 'enabled',
        description_nl: `Geniet van ${d.nl}`,
      },
    });
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Reverse the changes made in the `up` function if desired.
  // For a fully clean rollback, you'd delete the newly-inserted data:
  await payload.delete({ collection: 'users', where: { email: { like: '%' } } });
  await payload.delete({ collection: 'tenants', where: { name: { like: '%' } } });
  await payload.delete({ collection: 'pages', where: { slug: { like: '%' } } });

  // Delete newly created shops, categories, subproducts, products, popups:
  await payload.delete({ collection: 'shops', where: { name: { like: '%' } } });
  await payload.delete({ collection: 'productpopups', where: { popup_title_nl: { like: '%' } } });
  await payload.delete({ collection: 'subproducts', where: { name_nl: { like: '%' } } });
  await payload.delete({ collection: 'categories', where: { name_nl: { like: '%' } } });
  await payload.delete({ collection: 'products', where: { name_nl: { like: '%' } } });
}
