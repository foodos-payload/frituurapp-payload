'use client';

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
  FaLock,
} from 'react-icons/fa'
import { RangeSalesChart } from './RangeSalesChart'

// For your "Active Services"
type ServiceCard = {
  id: string
  title_nl: string
  description_nl?: string
  monthly_price?: string
  yearly_price?: string
  service_thumbnail?: {
    filename: string
    url?: string
    sizes?: {
      icon?: { url: string }
      card?: { url: string }
      // etc. depends on your media config
    }
  }
}

// NEW: add nonActiveServices to Props
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

  // Active services
  activeServices: ServiceCard[]

  // NEW: locked modules
  nonActiveServices: ServiceCard[]
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

  // Active services
  activeServices,

  // NEW locked modules
  nonActiveServices,
}) => {
  if (error) {
    return (
      <Gutter>
        <div style={{ color: 'red' }}>Dashboard Error: {error}</div>
      </Gutter>
    )
  }

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
      {/* HEADER */}
      <section
        id="dashboard-header-wrap"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '10px',
        }}
      >
        <h1 style={{ fontSize: '1.7em', margin: 0 }}>Dashboard</h1>
        <button
          id="action-save"
          className="btn-kitchen-screen flex justify-center items-center"
          style={{
            whiteSpace: 'nowrap',
          }}
        >
          Go to kitchen screen{' '}
          <span style={{ marginLeft: '0.5em', display: 'flex', alignItems: 'center' }}>
            <FaArrowRight />
          </span>
        </button>
      </section>

      {/* MAIN & ASIDE WRAPPER */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {/* MAIN CONTENT */}
        <main
          style={{
            flex: '1 1 400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* TIME RANGE SWITCHER */}
          <section id="dashboard-order-info">
            {/* Range switch buttons */}
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

            {/* TOP 2 CARDS (Orders & Per Type) */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {/* LEFT CARD => Total Orders */}
              <div
                style={{
                  flex: '1 1 150px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '180px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#E2E2E2',
                    height: '72px',
                    width: '72px',
                    borderRadius: '100%',
                    marginBottom: '1rem',
                  }}
                >
                  <FaShoppingBag size={30} />
                </div>
                <strong style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {totalOrders}
                </strong>
                <p style={{ margin: 0 }}>Orders ({label})</p>
              </div>

              {/* RIGHT CARD => Per Type */}
              <div
                style={{
                  flex: '1 1 150px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '180px',
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
                    <FaShoppingBag size={30} />
                    <strong style={{ fontSize: '2rem' }}>{tky}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '15px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <FaUtensils size={30} />
                    <strong style={{ fontSize: '2rem' }}>{din}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '15px',
                    }}
                  >
                    <FaTruck size={30} />
                    <strong style={{ fontSize: '2rem' }}>{del}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SALES CHART */}
          <section id="dashboard-sales-chart">
            <RangeSalesChart selectedRange={selectedRange} />
          </section>

          {/* BOTTOM 3 CARDS (Stock Manage) */}
          <section id="dashboard-stock-manage" style={{ marginTop: '1rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Products</h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {/* CATEGORIES */}
              <div
                style={{
                  flex: '1 1 180px',
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
                <strong style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                  {totalCategories}
                </strong>
                <p style={{ margin: 0 }}>Categories</p>
              </div>

              {/* PRODUCTS */}
              <div
                style={{
                  flex: '1 1 180px',
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
                <strong style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                  {totalProducts}
                </strong>
                <p className="font-bold" style={{ margin: 0 }}>Products</p>
              </div>

              {/* OUT OF STOCK */}
              <div
                style={{
                  flex: '1 1 180px',
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
                <strong style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                  {outOfStockCount}
                </strong>
                <p style={{ margin: 0 }}>Out of Stock</p>
              </div>
            </div>
          </section>
        </main>

        {/* ASIDE => Active + Locked Services */}
        <aside
          id="dashboard-aside-right"
          style={{
            flex: '1 1 300px',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '0.5rem 1rem',
            marginTop: '8px',
          }}
        >
          <h2 className="text-lg font-bold">Active Modules</h2>

          {activeServices.length === 0 && (
            <div
              style={{
                backgroundColor: '#f0f0f0',
                padding: '1rem',
                borderRadius: '10px',
              }}
            >
              <p style={{ margin: 0 }}>No active services</p>
            </div>
          )}

          {activeServices.map((svc) => {
            const thumbURL =
              svc.service_thumbnail?.sizes?.card?.url ||
              svc.service_thumbnail?.url ||
              'https://via.placeholder.com/150'

            return (
              <div
                key={svc.id}
                style={{
                  backgroundColor: '#f0f0f0',
                  padding: '1rem',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                }}
              >
                <img
                  src={thumbURL}
                  alt={svc.title_nl}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    mixBlendMode: 'multiply',
                  }}
                />
                <div>
                  <strong>{svc.title_nl}</strong>
                </div>
              </div>
            )
          })}

          {/* NEW LOCKED MODULES SECTION */}
          <h2 className="text-lg font-bold">Locked Modules</h2>

          {nonActiveServices.length === 0 && (
            <div
              style={{
                backgroundColor: '#f0f0f0',
                padding: '1rem',
                borderRadius: '10px',
              }}
            >
              <p style={{ margin: 0 }}>No locked services</p>
            </div>
          )}

          {nonActiveServices.map((svc) => {
            const thumbURL =
              svc.service_thumbnail?.sizes?.card?.url ||
              svc.service_thumbnail?.url ||
              'https://via.placeholder.com/150'

            return (
              <div
                key={svc.id}
                style={{
                  backgroundColor: '#f0f0f0',
                  padding: '1rem',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                }}
              >
                <img
                  src={thumbURL}
                  alt={svc.title_nl}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    mixBlendMode: 'multiply',
                  }}
                />
                <div>
                  <strong>{svc.title_nl}</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      style={{
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onClick={() => window.location.href = '/services'}
                    >
                      <FaLock style={{ marginRight: '0.5rem' }} />
                      Buy to unlock module
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </aside>
      </div>
    </Gutter>
  )
}
