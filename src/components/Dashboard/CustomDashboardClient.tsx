'use client';

import React, { useState } from 'react';
import { Gutter } from '@payloadcms/ui';
import {
  FaArrowRight,
  FaShoppingBag,
  FaUtensils,
  FaTruck,
  FaTags,
  FaBoxOpen,
  FaExclamationTriangle,
  FaLock,
} from 'react-icons/fa';
import { RangeSalesChart } from './RangeSalesChart';

// Inline type for "ServiceCard"
type ServiceCard = {
  id: string;
  title_nl: string;
  description_nl?: string;
  monthly_price?: string;
  yearly_price?: string;
  service_thumbnail?: {
    filename: string;
    url?: string;
    sizes?: {
      icon?: { url: string };
      card?: { url: string };
      // etc. depends on your media config
    };
  };
};

// The props for our dashboard client
type Props = {
  error: string | null;

  // 24H
  last24hOrders: number;
  takeawayCount: number;
  dineinCount: number;
  deliveryCount: number;

  // 7D
  last7dOrders: number;
  takeawayCount7d: number;
  dineinCount7d: number;
  deliveryCount7d: number;

  // 30D
  last30dOrders: number;
  takeawayCount30d: number;
  dineinCount30d: number;
  deliveryCount30d: number;

  // existing
  totalCategories: number;
  totalProducts: number;
  outOfStockCount: number;

  // Active services
  activeServices: ServiceCard[];

  // locked modules
  nonActiveServices: ServiceCard[];
};

// Make sure you import your CSS file below (if Next.js allows):
// import './CustomDashboardClient.css'; 

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

  // locked modules
  nonActiveServices,
}) => {
  if (error) {
    return (
      <Gutter>
        <div style={{ color: 'red' }}>Dashboard Error: {error}</div>
      </Gutter>
    );
  }

  const [selectedRange, setSelectedRange] = useState<'24h' | '7d' | '30d'>('24h');

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
        };
      case '30d':
        return {
          totalOrders: last30dOrders,
          takeaway: takeawayCount30d,
          dinein: dineinCount30d,
          delivery: deliveryCount30d,
          label: '30 Days',
        };
      case '24h':
      default:
        return {
          totalOrders: last24hOrders,
          takeaway: takeawayCount,
          dinein: dineinCount,
          delivery: deliveryCount,
          label: '24 Hours',
        };
    }
  };

  const { totalOrders, takeaway: tky, dinein: din, delivery: del, label } = getRangeData();

  return (
    /* 
       We assume you've added className="dashboard-gutter" 
       to your CSS so it can handle re-flow 
    */
    <Gutter className="dashboard-gutter">
      {/* HEADER */}
      <section className="dashboard-header-wrap" id="dashboard-header-wrap">
        <h1>Dashboard</h1>
        <button id="action-save" className="btn-kitchen-screen flex justify-center items-center">
          Go to kitchen screen <span style={{ marginLeft: '0.5em' }}><FaArrowRight /></span>
        </button>
      </section>

      {/* MAIN & ASIDE WRAPPER */}
      <div className="dashboard-main-aside">
        {/* MAIN CONTENT */}
        <main className="dashboard-main">
          {/* TIME RANGE SWITCHER */}
          <section id="dashboard-order-info">
            <div className="dashboard-switcher">
              <button
                className={selectedRange === '24h' ? 'active' : ''}
                onClick={() => setSelectedRange('24h')}
              >
                24H
              </button>
              <button
                className={selectedRange === '7d' ? 'active' : ''}
                onClick={() => setSelectedRange('7d')}
              >
                7D
              </button>
              <button
                className={selectedRange === '30d' ? 'active' : ''}
                onClick={() => setSelectedRange('30d')}
              >
                1M
              </button>
            </div>

            {/* TOP 2 CARDS */}
            <div className="cards-row-2">
              {/* LEFT CARD => Total Orders */}
              <div className="top-card">
                <div className="icon-circle">
                  <FaShoppingBag size={30} />
                </div>
                <strong className="big-number">{totalOrders}</strong>
                <p>Orders ({label})</p>
              </div>

              {/* RIGHT CARD => Per Type */}
              <div className="top-card">
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
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '0.5rem' }}>
                    <FaShoppingBag size={30} />
                    <strong className="big-number">{tky}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '0.5rem' }}>
                    <FaUtensils size={30} />
                    <strong className="big-number">{din}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <FaTruck size={30} />
                    <strong className="big-number">{del}</strong>
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
            <div className="cards-row-3">
              {/* CATEGORIES */}
              <div className="bottom-card">
                <div className="icon-circle">
                  <FaTags size={25} />
                </div>
                <strong className="bottom-title">{totalCategories}</strong>
                <p className="note">Categories</p>
              </div>

              {/* PRODUCTS */}
              <div className="bottom-card">
                <div className="icon-circle">
                  <FaBoxOpen size={25} />
                </div>
                <strong className="bottom-title">{totalProducts}</strong>
                <p className="note">Products</p>
              </div>

              {/* OUT OF STOCK */}
              <div className="bottom-card">
                <div className="icon-circle">
                  <FaExclamationTriangle size={25} />
                </div>
                <strong className="bottom-title">{outOfStockCount}</strong>
                <p className="note">Out of Stock</p>
              </div>
            </div>
          </section>
        </main>

        {/* ASIDE => Active + Locked Services */}
        <div className="dashboard-aside">
          <h2 className="text-lg font-bold">Active Modules</h2>

          {activeServices.length === 0 && (
            <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '10px' }}>
              <p style={{ margin: 0 }}>No active services</p>
            </div>
          )}

          <div className="modules-list">
            {activeServices.map((svc) => {
              const thumbURL =
                svc.service_thumbnail?.sizes?.card?.url ||
                svc.service_thumbnail?.url ||
                'https://via.placeholder.com/150';

              return (
                <div key={svc.id} className="module-card">
                  <img src={thumbURL} alt={svc.title_nl} className="module-img" />
                  <div>
                    <strong>{svc.title_nl}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* NEW LOCKED MODULES SECTION */}
          <h2 className="text-lg font-bold">Locked Modules</h2>

          {nonActiveServices.length === 0 && (
            <div style={{ backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '10px' }}>
              <p style={{ margin: 0 }}>No locked services</p>
            </div>
          )}

          <div className="modules-list">
            {nonActiveServices.map((svc) => {
              const thumbURL =
                svc.service_thumbnail?.sizes?.card?.url ||
                svc.service_thumbnail?.url ||
                'https://via.placeholder.com/150';

              return (
                <div key={svc.id} className="module-card">
                  <img src={thumbURL} alt={svc.title_nl} className="module-img" />
                  <div>
                    <strong>{svc.title_nl}</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        className="module-lock-btn"
                        onClick={() => (window.location.href = '/services')}
                      >
                        <FaLock style={{ marginRight: '0.5rem' }} />
                        Buy to unlock module
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Gutter>
  );
};
