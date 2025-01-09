import type { CollectionConfig } from 'payload';


const Roles: CollectionConfig = {
    slug: 'roles',
    admin: {
        useAsTitle: 'name',
        components: {
            views: {
                edit: {
                    root: {
                        Component: '@/fields/custom-field/collections-field.tsx'
                    }
                }
            }
        }
    },
    labels: {
        plural: {
            en: 'Roles',
            nl: 'Rollen',
            de: 'Rollen',
            fr: 'Rôles',
        },
        singular: {
            en: 'Role',
            nl: 'Rol',
            de: 'Rolle',
            fr: 'Rôle',
        },
    },
    fields: [
        {
            name: "name",
            type: "text",
            label: {
                en: "Name",
                nl: "Naam",
                de: "Name",
                fr: "Nom",
            }
        },
        // {
        //     name: "permissions",
        //     type: "array",
        //     label: {
        //         en: "Permissions",
        //         nl: "Permissies",
        //         de: "Berechtigungen",
        //         fr: "Permissions",
        //     },
        //     fields: [
        //         {
        //             name: "shops",
        //             type: "array",
        //             label: {
        //                 en: "Shops",
        //                 nl: "Winkels",
        //                 de: "Shops",
        //                 fr: "Shops",
        //             },
        //         }
        //     ]
        // }
        {
            name: "collections",
            type: "array",
            admin: {
                components: {
                    Field: '@/fields/custom-field/collections-field.tsx'
                }
            },
            fields: [
                {
                    name: "collectionName",
                    type: "text",
                    label: {
                        en: "Collection Name",
                        nl: "Collectie Naam",
                        de: "Collection Name",
                        fr: "Nom de la collection",
                    }
                },
                {
                    name: "read",
                    type: "checkbox",
                    label: {
                        en: "Read",
                        nl: "Lezen",
                        de: "Lesen",
                        fr: "Lire",
                    }
                },
                {
                    name: "create",
                    type: "checkbox",
                    label: {
                        en: "Create",
                        nl: "Aanmaken",
                        de: "Erstellen",
                        fr: "Créer",
                    }
                },
                {
                    name: "update",
                    type: "checkbox",
                    label: {
                        en: "Update",
                        nl: "Bewerken",
                        de: "Bearbeiten",
                        fr: "Modifier",
                    }
                },
                {
                    name: "delete",
                    type: "checkbox",
                    label: {
                        en: "Delete",
                        nl: "Verwijderen",
                        de: "Löschen",
                        fr: "Supprimer",
                    }
                },
            ]
        }
    ],
};

export default Roles;
