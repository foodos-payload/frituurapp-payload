'use client'

import React, { useState } from 'react'
import { Gutter } from '@payloadcms/ui'
import {
  FaArrowRight,
  FaShoppingBag,
  FaUtensils,
  FaTruck,
  FaTags,
  FaBoxOpen,
  FaExclamationTriangle,
} from 'react-icons/fa'
import { RangeSalesChart } from './RangeSalesChart'

type Props = {
  error: string | null

  // 24H
  last24hOrders: number
  takeawayCount: number
  dineinCount: number
  deliveryCount: number

  // 7D
  last7dOrders: number
  takeawayCount7d: number
  dineinCount7d: number
  deliveryCount7d: number

  // 30D
  last30dOrders: number
  takeawayCount30d: number
  dineinCount30d: number
  deliveryCount30d: number

  // existing
  totalCategories: number
  totalProducts: number
  outOfStockCount: number
}

export const CustomDashboardClient: React.FC<Props> = ({
  error,

  // 24H
  last24hOrders,
  takeawayCount,
  dineinCount,
  deliveryCount,

  // 7D
  last7dOrders,
  takeawayCount7d,
  dineinCount7d,
  deliveryCount7d,

  // 30D
  last30dOrders,
  takeawayCount30d,
  dineinCount30d,
  deliveryCount30d,

  // existing
  totalCategories,
  totalProducts,
  outOfStockCount,
}) => {
  if (error) {
    return (
      <Gutter>
        <div style={{ color: 'red' }}>Dashboard Error: {error}</div>
      </Gutter>
    )
  }

  // Range state used for both the cards AND the chart
  const [selectedRange, setSelectedRange] = useState<'24h' | '7d' | '30d'>('24h')

  // Return stats based on selected range
  const getRangeData = () => {
    switch (selectedRange) {
      case '7d':
        return {
          totalOrders: last7dOrders,
          takeaway: takeawayCount7d,
          dinein: dineinCount7d,
          delivery: deliveryCount7d,
          label: '7 Days',
        }
      case '30d':
        return {
          totalOrders: last30dOrders,
          takeaway: takeawayCount30d,
          dinein: dineinCount30d,
          delivery: deliveryCount30d,
          label: '30 Days',
        }
      case '24h':
      default:
        return {
          totalOrders: last24hOrders,
          takeaway: takeawayCount,
          dinein: dineinCount,
          delivery: deliveryCount,
          label: '24 Hours',
        }
    }
  }

  const { totalOrders, takeaway: tky, dinein: din, delivery: del, label } = getRangeData()

  return (
    <Gutter>
      <section id="dashboard-header-wrap" className="doc-header flex justify-between mb-10">
        <h1 style={{ fontSize: '1.7em' }}>Dashboard</h1>
        <button id="action-save" className="btn-kitchen-screen flex justify-center items-center">
          Go to kitchen screen{' '}
          <span style={{ marginLeft: '0.5em', display: 'flex', alignItems: 'center' }}>
            <FaArrowRight />
          </span>
        </button>
      </section>

      <div style={{ display: 'flex', gap: '20px' }}>
        <main style={{ flex: 1 }}>
          {/* TIME RANGE SWITCHER + 2-CARD ROW */}
          <section id="dashboard-order-info">
            {/* Switcher */}
            <div style={{ marginBottom: '1rem' }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  marginRight: '0.5rem',
                  backgroundColor: selectedRange === '24h' ? '#ddd' : '#f0f0f0',
                }}
                onClick={() => setSelectedRange('24h')}
              >
                24H
              </button>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  marginRight: '0.5rem',
                  backgroundColor: selectedRange === '7d' ? '#ddd' : '#f0f0f0',
                }}
                onClick={() => setSelectedRange('7d')}
              >
                7D
              </button>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: selectedRange === '30d' ? '#ddd' : '#f0f0f0',
                }}
                onClick={() => setSelectedRange('30d')}
              >
                1M
              </button>
            </div>

            {/* Cards Row */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'nowrap',
              }}
            >
              {/* LEFT CARD => Total Orders */}
              <div
                style={{
                  flex: '1 1 50%',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '200px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#E2E2E2',
                    height: '82px',
                    width: '82px',
                    borderRadius: '100%',
                    marginBottom: '1rem',
                  }}
                >
                  <FaShoppingBag size={30} />
                </div>
                <strong className="text-3xl mb-2">{totalOrders}</strong>
                <p>Orders ({label})</p>
              </div>

              {/* RIGHT CARD => Breakdown by type */}
              <div
                style={{
                  flex: '1 1 50%',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '200px',
                }}
              >
                <p
                  style={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  Per Type ({label})
                </p>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '15px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaShoppingBag size={30} />
                    </div>
                    <strong className="text-3xl">{tky}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '15px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaUtensils size={30} />
                    </div>
                    <strong className="text-3xl">{din}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '15px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaTruck size={30} />
                    </div>
                    <strong className="text-3xl">{del}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Chart that also changes with the same selectedRange! */}
          <section id="dashboard-sales-chart" style={{ marginTop: '2rem' }}>
            <RangeSalesChart selectedRange={selectedRange} />
          </section>

          {/* STOCK MANAGE SECTION */}
          <section id="dashboard-stock-manage" style={{ marginTop: '2rem' }}>
            <h2>Products</h2>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'nowrap',
              }}
            >
              {/* CATEGORIES CARD */}
              <div
                style={{
                  flex: '1 1 33%',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '150px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#E2E2E2',
                    height: '60px',
                    width: '60px',
                    borderRadius: '100%',
                    marginBottom: '0.5rem',
                  }}
                >
                  <FaTags size={25} />
                </div>
                <strong className="text-2xl mb-1">{totalCategories}</strong>
                <p>Categories</p>
              </div>

              {/* PRODUCTS CARD */}
              <div
                style={{
                  flex: '1 1 33%',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '150px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#E2E2E2',
                    height: '60px',
                    width: '60px',
                    borderRadius: '100%',
                    marginBottom: '0.5rem',
                  }}
                >
                  <FaBoxOpen size={25} />
                </div>
                <strong className="text-2xl mb-1">{totalProducts}</strong>
                <p>Products</p>
              </div>

              {/* OUT OF STOCK CARD */}
              <div
                style={{
                  flex: '1 1 33%',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '150px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#E2E2E2',
                    height: '60px',
                    width: '60px',
                    borderRadius: '100%',
                    marginBottom: '0.5rem',
                  }}
                >
                  <FaExclamationTriangle size={25} />
                </div>
                <strong className="text-2xl mb-1">{outOfStockCount}</strong>
                <p>Out of Stock</p>
              </div>
            </div>
          </section>
        </main>

        <aside
          id="dashboard-aside-right"
          className="flex flex-col gap-2"
          style={{ width: '300px', marginLeft: '20px' }}
        >
          <h2>Aside Right</h2>
          <div style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
            Recent Orders by status (Placeholder)
          </div>
          <div style={{ backgroundColor: '#f0f0f0', padding: '1rem' }}>
            Favorite product of the week (Placeholder)
          </div>
        </aside>
      </div>
    </Gutter>
  )
}
