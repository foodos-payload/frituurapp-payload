'use client';

import React, { useEffect, useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// For 24h grouping
type HourData = {
    hour: string
    totalSales: number
    orderCount: number
}

// For 7d/30d grouping
type DayData = {
    date: string
    totalSales: number
    orderCount: number
}

type Props = {
    selectedRange: '24h' | '7d' | '30d'
}

export const RangeSalesChart: React.FC<Props> = ({ selectedRange }) => {
    const [chartData, setChartData] = useState<any>({
        labels: [],
        datasets: [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setLoading(true)

                // e.g. /api/getSalesData?range=24h|7d|30d
                const res = await fetch(`/api/getSalesData?range=${selectedRange}`, {
                    cache: 'no-store',
                })

                if (!res.ok) {
                    throw new Error(`Failed to fetch sales data: ${res.status}`)
                }

                // Could be an array of HourData or DayData
                const rawData: Array<HourData | DayData> = await res.json()

                let labels: string[] = []
                let sales: number[] = []
                let orders: number[] = []

                if (selectedRange === '24h') {
                    // Hourly data
                    const hourData = rawData as HourData[]
                    labels = hourData.map(d => d.hour)        // e.g. "00:00", "01:00", ...
                    sales = hourData.map(d => d.totalSales)
                    orders = hourData.map(d => d.orderCount)
                } else {
                    // Daily data for 7d or 30d
                    const dayData = rawData as DayData[]
                    labels = dayData.map(d => d.date)         // e.g. "2025-01-10"
                    sales = dayData.map(d => d.totalSales)
                    orders = dayData.map(d => d.orderCount)
                }

                const config = {
                    labels,
                    datasets: [
                        {
                            label: 'Total Sales (€)',
                            data: sales,
                            backgroundColor: '#068b59',
                            borderColor: '#068b59',
                            borderWidth: 1,
                            borderRadius: {
                                topLeft: 50,
                                topRight: 50,
                                bottomLeft: 0,
                                bottomRight: 0,
                            },
                            borderSkipped: false,
                        },
                        {
                            label: 'Order Count',
                            data: orders,
                            backgroundColor: '#0c131f',
                            borderColor: '#0c131f',
                            borderWidth: 1,
                            borderRadius: {
                                topLeft: 50,
                                topRight: 50,
                                bottomLeft: 0,
                                bottomRight: 0,
                            },
                            borderSkipped: false,
                        },
                    ],
                }

                setChartData(config)
                setError(null)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchChartData()
    }, [selectedRange]) // re-run whenever selectedRange changes

    if (loading) {
        return <div>Loading chart for {selectedRange}...</div>
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error loading chart: {error}</div>
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false, // no vertical grid lines
                },
            },
            y: {
                beginAtZero: true,
                grace: '10%',
                ticks: {
                    stepSize: 10,
                },
                grid: {
                    drawBorder: false,
                    color: '#ccc', // horizontal lines color
                },
            },
        },
    }

    return (
        <div style={{ width: '100%', height: '240px' }}>
            <Bar data={chartData} options={options} />
        </div>
    )
}
