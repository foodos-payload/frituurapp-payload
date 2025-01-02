'use client'

import React, { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import * as excelJs from 'exceljs'
import { toast } from '@payloadcms/ui'

type ImportState = {
    type: 'IDLE' | 'UPLOADING' | 'ERROR'
    error?: string
}

export function ExcelImportExport() {
    const [state, setState] = useState<ImportState>({ type: 'IDLE' })
    const [isLoading, setIsLoading] = useState(false)
    const [loadingText, setLoadingText] = useState('')
    
    const processExcelData = async (sheetData: any[]) => {
        console.log(sheetData)
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/import-products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData),
        })

        const result = await response.json()

        if (!result.success) {
            throw new Error(result.error)
        }

        // Show success message
        toast('Products imported successfully')


    }

    const xlsxJson = useCallback((buffer: ArrayBuffer) => {
        const wb = new excelJs.Workbook()

        wb.xlsx.load(buffer).then(async (workbook) => {
            const sheets: any[] = []
            workbook.eachSheet((sheet, id) => {
                const sheetData: any[] = []
                let headers: string[] = []

                sheet.eachRow((row, rowIndex) => {
                    const rowData: any = {}

                    if (rowIndex === 1) {
                        headers = (row.values as string[])?.filter(Boolean)
                    } else {
                        row.eachCell((cell, colNumber) => {
                            const header = headers[colNumber - 1]
                            let value = cell.value

                            // Handle shops field specifically
                            if (header === 'shops' && typeof value === 'string') {
                                try {
                                    // Remove single quotes and parse the string array
                                    const cleanValue = value.replace(/'/g, '"')
                                    rowData[header] = JSON.parse(cleanValue)
                                    return // Skip setting the value below
                                } catch (error) {
                                    console.error('Error parsing shops:', error)
                                    rowData[header] = []
                                    return // Skip setting the value below
                                }
                            }
                            console.log(header)
                            console.log(value)
                            if (header === 'categories') {
                                console.log('Raw categories value:', value)
                                console.log('Type of value:', typeof value)

                                // If value is null, undefined, or empty string, set empty array
                                if (!value) {
                                    rowData[header] = []
                                    return
                                }

                                try {
                                    const stringValue = String(value)
                                    // Remove outer quotes if they exist
                                    const trimmedValue = stringValue.trim().replace(/^"(.*)"$/, '$1')

                                    // Handle both string array format and JSON string format
                                    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
                                        // First clean any single quotes
                                        const cleanValue = trimmedValue.replace(/'/g, '"')
                                        rowData[header] = JSON.parse(cleanValue)
                                    } else {
                                        // If it's a single value, wrap it in an array
                                        rowData[header] = [trimmedValue]
                                    }
                                    console.log('Parsed categories:', rowData[header])
                                    return // Skip setting the value below
                                } catch (error) {
                                    console.error('Error parsing categories:', error, value)
                                    rowData[header] = []
                                    return // Skip setting the value below
                                }
                            }

                            // Convert boolean strings to actual booleans
                            if (value === 'TRUE' || value === 'true') {
                                value = true
                            } else if (value === 'FALSE' || value === 'false') {
                                value = false
                            }

                            rowData[header] = value
                        })
                        sheetData.push(rowData)
                    }
                })

                sheets.push(sheetData)
            })

            try {
                setIsLoading(true)
                await processExcelData(sheets[0])
                setState({ type: 'IDLE' })
            } catch (err) {
                setState({ type: 'ERROR', error: 'Error Processing.' })
            } finally {
                setIsLoading(false)
            }
        })
    }, [])

    const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoadingText('Importing Data. This may take a few seconds.')

        const formElement = e.currentTarget as HTMLFormElement
        const fileInput = formElement.querySelector('input[type="file"]') as HTMLInputElement
        const file = fileInput.files?.[0]

        if (!file) {
            setState({ type: 'ERROR', error: 'File not found.' })
            toast('File not found.')
            return
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''

        setState({ type: 'UPLOADING' })
        const reader = new FileReader()

        if (fileExtension === 'xlsx') {
            reader.onload = () => {
                const buffer = reader.result as ArrayBuffer
                xlsxJson(buffer)
            }
            reader.readAsArrayBuffer(file)
        } else {
            toast('Please upload an XLSX file')
        }
    }, [xlsxJson, toast])

    return (
        <div className="flex flex-col gap-4">
            <form onSubmit={onSubmit} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        accept=".xlsx"
                        id="excel-upload"
                        className="hidden"
                        name="file"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                const formElement = e.target.form
                                if (formElement) {
                                    formElement.requestSubmit()
                                }
                            }
                        }}
                    />
                    <button
                        type="button"
                        disabled={isLoading}
                        className="flex items-center gap-2"
                        onClick={() => {
                            document.getElementById('excel-upload')?.click()
                        }}
                    >
                        <Upload className="h-4 w-4" />
                        {isLoading ? loadingText : 'Import Products'}
                    </button>
                </div>
                {state.type === 'ERROR' && (
                    <p className="text-sm text-red-500">{state.error}</p>
                )}
            </form>
            {state.type === 'UPLOADING' && (
                <p className="text-sm text-gray-500">
                    Uploading and processing your file...
                </p>
            )}
        </div>
    )
}

export default ExcelImportExport