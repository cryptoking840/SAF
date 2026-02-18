import React, { useState, useEffect } from 'react';
import * as safApi from '../../api/safApi';
import Loader from '../../components/Loader';

export default function AirlineMyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyBids();
    const interval = setInterval(fetchMyBids, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      const response = await safApi.fetchMyBids();
      
      if (response && response.data) {
        setBids(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
      case 'Countered':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'Accepted':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'Denied':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400';
    }
  };

  const filteredBids = bids.filter(bid => {
    const matchesStatus = filterStatus === 'all' || bid.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const batchIdStr = bid.batchId ? String(bid.batchId).toLowerCase() : '';
    const certIdStr = bid.certificateId ? String(bid.certificateId).toLowerCase() : '';
    const matchesSearch = batchIdStr.includes(searchLower) || certIdStr.includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  if (loading) return <Loader />;

  const statusOptions = ['all', 'Pending', 'Countered', 'Accepted', 'Denied'];

  return (
    <div className="w-full p-8 bg-background-light dark:bg-background-dark min-h-screen overflow-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">My Bids</h1>
        <p className="text-slate-600 dark:text-slate-400">Track all bids you've placed in the marketplace</p>
      </header>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search batch or certificate ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchMyBids}
              className="w-full px-4 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Bids Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            All Bids ({filteredBids.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {filteredBids.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Certificate ID</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Bid Price</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredBids.map((bid) => (
                  <tr key={bid._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-base">shopping_cart</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                          {bid.certificateId || `BID-${bid._id?.substring(0, 8)}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                        {bid.quantity} MT
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-200">
                        ${bid.price?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {bid.supplierWallet?.substring(0, 6)}...{bid.supplierWallet?.substring(-4)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(bid.status)}`}>
                        {bid.approvedByRegistry ? (
                          <><span>✓ Trade Approved</span></>
                        ) : (
                          bid.status
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {bid.createdAt ? new Date(bid.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">shopping_cart</span>
              <p>No bids found. Start bidding in the marketplace!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
