import React, { useState, useEffect } from 'react';
import * as safApi from '../../api/safApi';
import Loader from '../../components/Loader';

export default function AirlineCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCertificates();
    const interval = setInterval(fetchCertificates, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await safApi.fetchMyBids();
      
      if (response && response.data) {
        // Only show approved/verified certificates
        const certs = response.data
          .filter(bid => bid.status === 'Accepted' || bid.status === 'Trade Approved' || bid.approvedByRegistry)
          .map(bid => ({
            id: bid._id,
            certificateId: `SAF-${bid.batchYear || 2024}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            quantity: bid.quantity,
            source: bid.source || 'Bio-Waste SAF',
            co2Offset: bid.co2Offset || (bid.quantity * 3.2),
            price: bid.price,
            status: bid.approvedByRegistry ? 'Verified' : 'Pending',
            approvedByRegistry: bid.approvedByRegistry,
            batchId: bid.batchId,
            createdAt: bid.createdAt
          }));
        
        setCertificates(certs);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Verified' || status === 'Trade Approved'
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
  };

  const handleViewDetails = (cert) => {
    setSelectedCert(cert);
    setShowDetailModal(true);
  };

  const filteredCerts = certificates.filter(cert => {
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const certIdStr = cert.certificateId ? String(cert.certificateId).toLowerCase() : '';
    const sourceStr = cert.source ? String(cert.source).toLowerCase() : '';
    const matchesSearch = certIdStr.includes(searchLower) || sourceStr.includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  if (loading) return <Loader />;

  return (
    <div className="w-full p-8 bg-background-light dark:bg-background-dark min-h-screen overflow-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">My Certificates</h1>
        <p className="text-slate-600 dark:text-slate-400">View and manage your SAF certificates</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Total Certificates</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{certificates.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Owned and verified</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Total CO2 Offset</p>
          <h3 className="text-3xl font-black text-primary">
            {certificates.reduce((sum, cert) => sum + cert.co2Offset, 0).toLocaleString()}
          </h3>
          <p className="text-xs text-slate-500 mt-2">MT CO2e</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Verified Certificates</p>
          <h3 className="text-3xl font-black text-emerald-600">
            {certificates.filter(c => c.approvedByRegistry).length}
          </h3>
          <p className="text-xs text-slate-500 mt-2">Registry approved</p>
        </div>
      </div>

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
                placeholder="Search certificate ID..."
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
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchCertificates}
              className="w-full px-4 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Certificates ({filteredCerts.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          {filteredCerts.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Certificate ID</th>
                  <th className="px-6 py-4">Fuel Source</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">CO2 Offset</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-base">description</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                          {cert.certificateId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{cert.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                        {cert.quantity.toLocaleString()} MT
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">
                        {cert.co2Offset.toFixed(0)} MT
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(cert.status)}`}>
                        {cert.approvedByRegistry ? '✓ Trade Approved' : cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(cert)}
                        className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">verified_user</span>
              <p>No certificates yet. Place bids in the marketplace to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Details Modal */}
      {showDetailModal && selectedCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="sticky top-0 p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">description</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Certificate Details</h3>
                  <p className="text-sm text-slate-500">{selectedCert.certificateId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCert(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Certificate ID</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedCert.certificateId}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedCert.status)}`}>
                    {selectedCert.approvedByRegistry ? '✓ Trade Approved' : selectedCert.status}
                  </span>
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Quantity</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedCert.quantity.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Metric Tons of SAF</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">CO2 Offset</p>
                  <p className="text-2xl font-black text-primary">{selectedCert.co2Offset.toFixed(0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Metric Tons CO2e</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Fuel Source</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedCert.source}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Purchase Price</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">${selectedCert.price?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-emerald-600">eco</span>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Environmental Impact</p>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  This certificate represents <strong>{selectedCert.co2Offset.toFixed(0)} MT</strong> of CO2 equivalent offset through sustainable aviation fuel. This is equivalent to taking <strong>{Math.round(selectedCert.co2Offset / 4.6)}</strong> cars off the road for one year.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCert(null);
                }}
                className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
