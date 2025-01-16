"use client";
import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { getAllFields, saveRole } from "./api";
import {
    PermissionAction,
    RoleDoc,
    CollectionPermission,
    FieldsPermission,
} from "./types";
import { PermissionCheckbox } from "./PermissionCheckbox";

const PERMISSION_ACTIONS: { action: PermissionAction; label: string }[] = [
    { action: "read", label: "Read" },
    { action: "create", label: "Create" },
    { action: "update", label: "Update" },
    { action: "delete", label: "Delete" },
];

interface CollectionsAndFieldsProps {
    collectionNames: string[];
    doc?: RoleDoc; // doc includes doc.id, doc.name, doc.collections, doc.fields
}

// Collapsed state for each collection
type CollapsedMap = Record<string, boolean>;

export default function CollectionsAndFieldsTable({
    collectionNames,
    doc,
}: CollectionsAndFieldsProps) {
    // Basic role name
    const [roleName, setRoleName] = useState(doc?.name || "");
    const [initialRoleName] = useState(doc?.name || "");

    // Collection-level perms
    const [collectionsPermissions, setCollectionsPermissions] =
        useState<CollectionPermission[]>(
            doc?.collections?.length
                ? doc.collections
                : collectionNames.map((name) => ({
                    collectionName: name,
                    read: false,
                    create: false,
                    update: false,
                    delete: false,
                }))
        );
    const [initialCollections] = useState<CollectionPermission[]>(
        doc?.collections || []
    );

    // Field-level perms
    const [fieldsPermissions, setFieldsPermissions] = useState<FieldsPermission[]>(
        doc?.fields || []
    );
    const [initialFields] = useState<FieldsPermission[]>(doc?.fields || []);

    // All fields from /api/getAllFields
    const [allCollectionFields, setAllCollectionFields] = useState<
        { collectionName: string; fieldName: string }[]
    >([]);

    // Collapsed or expanded?
    const [collapsedMap, setCollapsedMap] = useState<CollapsedMap>(() =>
        collectionNames.reduce((acc, col) => {
            acc[col] = true; // default collapsed
            return acc;
        }, {} as CollapsedMap)
    );

    const [isFormChanged, setIsFormChanged] = useState(false);

    // Fetch all fields on mount
    useEffect(() => {
        async function fetchAll() {
            try {
                const data = await getAllFields(); // GET /api/getAllFields
                // data = [ { slug: 'users', fields: [ {name:'email'}, ... ] }, ... ]
                const flattened: { collectionName: string; fieldName: string }[] = [];
                data.forEach((col: any) => {
                    col.fields?.forEach((fld: any) => {
                        if (fld.name) {
                            flattened.push({
                                collectionName: col.slug,
                                fieldName: fld.name,
                            });
                        }
                    });
                });
                setAllCollectionFields(flattened);
            } catch (err) {
                console.error("Failed to fetch fields:", err);
            }
        }
        fetchAll();
    }, []);

    // Check if form changed
    useEffect(() => {
        const nameChanged = roleName !== initialRoleName;
        const colChanged =
            JSON.stringify(collectionsPermissions) !== JSON.stringify(initialCollections);
        const fldChanged =
            JSON.stringify(fieldsPermissions) !== JSON.stringify(initialFields);
        setIsFormChanged(nameChanged || colChanged || fldChanged);
    }, [
        roleName,
        collectionsPermissions,
        fieldsPermissions,
        initialRoleName,
        initialCollections,
        initialFields,
    ]);

    // Handlers
    function handleRoleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        setRoleName(e.target.value);
    }

    // Update collection-level perms
    function handleCollectionCheckbox(
        collectionName: string,
        action: PermissionAction,
        checked: boolean
    ) {
        setCollectionsPermissions((prev) =>
            prev.map((item) =>
                item.collectionName === collectionName ? { ...item, [action]: checked } : item
            )
        );
    }

    // Toggle collapse
    function toggleCollapsed(collectionName: string) {
        setCollapsedMap((prev) => ({
            ...prev,
            [collectionName]: !prev[collectionName],
        }));
    }

    // Update field-level perms
    function handleFieldCheckbox(
        collectionName: string,
        fieldName: string,
        action: PermissionAction,
        checked: boolean
    ) {
        setFieldsPermissions((prev) => {
            const index = prev.findIndex(
                (fp) => fp.collectionName === collectionName && fp.fieldName === fieldName
            );
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = { ...updated[index], [action]: checked };
                return updated;
            } else {
                return [
                    ...prev,
                    {
                        collectionName,
                        fieldName,
                        read: false,
                        create: false,
                        update: false,
                        delete: false,
                        [action]: checked,
                    },
                ];
            }
        });
    }

    // Save
    async function handleSave() {
        if (!roleName.trim()) {
            toast.error("Role name is required");
            return;
        }
        try {
            await saveRole(doc?.id, {
                name: roleName,
                collections: collectionsPermissions,
                fields: fieldsPermissions,
            });
            setIsFormChanged(false);
            toast.success("Role updated successfully");
            setTimeout(() => {
                window.location.replace("/admin/collections/roles");
            }, 800);
        } catch (error) {
            console.error("Error saving role:", error);
        }
    }

    // Render
    return (
        <div className="flex flex-col gap-4 p-8">
            <Toaster position="top-center" />

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Role Permissions</h1>
                <button
                    onClick={handleSave}
                    disabled={!isFormChanged}
                    className={`px-4 py-2 rounded-lg transition-colors ${isFormChanged
                            ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    Save Changes
                </button>
            </div>

            {/* Role name */}
            <div className="flex flex-col gap-2">
                <h2>Role Name:</h2>
                <input
                    type="text"
                    value={roleName}
                    onChange={handleRoleNameChange}
                    className="border border-gray-300 rounded-xl p-2 focus-visible:outline-none w-full"
                />
            </div>

            <h2 className="text-lg font-bold">Collections & Fields</h2>
            <p className="text-sm text-gray-500">
                Set read/create/update/delete for each collection, plus optionally for each
                field (expand to see fields).
            </p>

            {collectionsPermissions.map((colPerm) => {
                const isCollapsed = collapsedMap[colPerm.collectionName] ?? true;

                // Filter all fields that belong to this collection
                const collectionFields = allCollectionFields.filter(
                    (f) => f.collectionName === colPerm.collectionName
                );

                // Merge existing field perms with newly found fields
                const mergedFieldPerms: FieldsPermission[] = collectionFields.map((f) => {
                    const existing = fieldsPermissions.find(
                        (fp) =>
                            fp.collectionName === f.collectionName && fp.fieldName === f.fieldName
                    );
                    return (
                        existing ?? {
                            collectionName: f.collectionName,
                            fieldName: f.fieldName,
                            read: false,
                            create: false,
                            update: false,
                            delete: false,
                        }
                    );
                });

                return (
                    <div key={colPerm.collectionName} className="border p-4 rounded-md mb-2">
                        {/* Collection header */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">
                                {colPerm.collectionName.toUpperCase()}
                            </h3>
                            <button
                                type="button"
                                onClick={() => toggleCollapsed(colPerm.collectionName)}
                                className="underline text-sm"
                            >
                                {isCollapsed ? "Show Fields" : "Hide Fields"}
                            </button>
                        </div>

                        {/* Collection-level perms */}
                        <div className="flex gap-4 my-2">
                            {PERMISSION_ACTIONS.map(({ action, label }) => (
                                <label key={action} className="flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={!!colPerm[action]}
                                        onChange={(e) =>
                                            handleCollectionCheckbox(
                                                colPerm.collectionName,
                                                action,
                                                e.target.checked
                                            )
                                        }
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>

                        {/* Field-level perms */}
                        {!isCollapsed && (
                            <div className="ml-4 mt-2 space-y-2">
                                {mergedFieldPerms.length === 0 && (
                                    <div className="text-sm italic text-gray-500">
                                        No named fields found for this collection.
                                    </div>
                                )}

                                {mergedFieldPerms.map((fieldObj) => (
                                    <div
                                        key={fieldObj.fieldName}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm font-medium">{fieldObj.fieldName}</span>
                                        <div className="flex gap-3">
                                            {PERMISSION_ACTIONS.map(({ action, label }) => (
                                                <label key={action} className="flex items-center gap-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!fieldObj[action]}
                                                        onChange={(e) =>
                                                            handleFieldCheckbox(
                                                                colPerm.collectionName,
                                                                fieldObj.fieldName,
                                                                action,
                                                                e.target.checked
                                                            )
                                                        }
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
