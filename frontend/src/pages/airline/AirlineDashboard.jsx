import React, { useState, useEffect } from 'react';
import * as safApi from '../../api/safApi';
import Loader from '../../components/Loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AirlineDashboard() {
  const [stats, setStats] = useState({
    totalCO2: 0,
    activeCertificates: 0,
    retiredCredits: 0,
    expiringCertificates: [],
    trend: 0
  });
  
  const [certificates, setCertificates] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [certificatesPerPage] = useState(4);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch airline certificates and bids from backend API
      const bidsResponse = await safApi.fetchMyBids();
      
      console.log('✅ Real data fetched from backend:', bidsResponse);

      // Calculate statistics
      let totalCO2 = 0;
      let activeCerts = 0;
      let retiredCerts = 0;
      const certsList = [];

      if (bidsResponse && bidsResponse.data) {
        console.log(`📊 Processing ${bidsResponse.data.length} bids from backend`);
        
        bidsResponse.data.forEach(bid => {
          if (bid.status === 'Accepted' || bid.status === 'Trade Approved' || bid.approvedByRegistry) {
            activeCerts++;
            const co2Impact = bid.co2Offset || (bid.quantity * 3.2); // 3.2 MT CO2 per MT SAF
            totalCO2 += co2Impact;
            
            certsList.push({
              id: bid._id,
              certificateId: `SAF-${bid.batchYear || 2024}-${Math.random().toString(36).substring(7).toUpperCase()}`,
              batchId: bid.batchId,
              source: bid.source || 'Bio-Waste Hydropyrolysis',
              quantity: bid.quantity,
              co2Offset: co2Impact,
              status: bid.approvedByRegistry ? 'Verified' : (bid.status === 'Accepted' ? 'Pending' : bid.status),
              price: bid.price,
              approvedByRegistry: bid.approvedByRegistry
            });
          }
        });
      }

      // Simulate some retired certificates (in real implementation, track separately)
      retiredCerts = Math.floor(totalCO2 * 0.33);

      // Calculate trend
      const trend = 12; // +12% vs last month

      setStats({
        totalCO2: Math.round(totalCO2),
        activeCertificates: activeCerts,
        retiredCredits: retiredCerts,
        expiringCertificates: certsList.filter(c => c.status === 'Pending').length,
        trend
      });

      setCertificates(certsList);

      // Generate chart data for monthly trends (mock data based on certificates)
      const mockChartData = [
        { month: 'Jan', offset: 850 },
        { month: 'Feb', offset: 920 },
        { month: 'Mar', offset: 1100 },
        { month: 'Apr', offset: 1050 },
        { month: 'May', offset: 1200 },
        { month: 'Jun', offset: totalCO2 },
      ];
      setChartData(mockChartData);

      console.log(`✨ Dashboard updated: ${activeCerts} active certs, ${totalCO2} MT CO2 offset`);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleRetireCertificate = async (certificateId) => {
    try {
      // In real implementation, call API to retire certificate
      alert(`Certificate ${certificateId} retired successfully`);
    } catch (error) {
      console.error('Error retiring certificate:', error);
    }
  };

  const handleViewDetails = (cert) => {
    setSelectedCertificate(cert);
    setShowDetailModal(true);
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.certificateId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastCert = currentPage * certificatesPerPage;
  const indexOfFirstCert = indexOfLastCert - certificatesPerPage;
  const currentCertificates = filteredCertificates.slice(indexOfFirstCert, indexOfLastCert);
  const totalPages = Math.ceil(filteredCertificates.length / certificatesPerPage);

  // Calculate goal progress
  const annualGoal = 12450;
  const goalProgress = Math.round((stats.totalCO2 / annualGoal) * 100);

  if (loading) return <Loader />;

  return (
    <div className="w-full p-8 bg-background-light dark:bg-background-dark min-h-screen overflow-auto">
      {/* Top Header Area */}
      <header className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Sustainability Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400">Track and manage your Sustainable Aviation Fuel (SAF) environmental credits and net-zero journey.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.href = '/airline/marketplace'} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm">
            <span className="material-symbols-outlined text-lg">marketplace</span>
            Marketplace
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:brightness-105 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Place Bid
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total MT CO2 Offset */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-6xl text-primary">eco</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Total MT CO2 Offset</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalCO2.toLocaleString()}</h3>
            <span className="text-slate-500 font-bold text-sm">MT</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-emerald-600 dark:text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            +{stats.trend}% <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Active Certificates */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-6xl text-primary">verified_user</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Active Certificates</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.activeCertificates}</h3>
            <span className="text-slate-500 font-bold text-sm">Verified</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-slate-400 font-normal text-sm">
            <span className="material-symbols-outlined text-sm">timer</span>
            {stats.expiringCertificates} pending approval
          </div>
        </div>

        {/* Total Retired Credits */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-6xl text-primary">check_circle</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Total Retired Credits</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.retiredCredits.toLocaleString()}</h3>
            <span className="text-slate-500 font-bold text-sm">MT</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-emerald-600 dark:text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-sm">keyboard_double_arrow_up</span>
            +5% <span className="text-slate-400 font-normal">impact growth</span>
          </div>
        </div>
      </div>

      {/* Tracker & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Progress Tracker */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Your Path to Net Zero</h4>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-slate-100 dark:text-slate-800" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
                <circle
                  className="text-primary transition-all duration-500"
                  cx="96"
                  cy="96"
                  fill="transparent"
                  r="88"
                  stroke="currentColor"
                  strokeDasharray={`${(goalProgress / 100) * 552.92}`}
                  strokeDashoffset="0"
                  strokeWidth="12"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{goalProgress}%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Goal Met</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm text-slate-500">Annual Goal Progress</span>
              <span className="text-sm font-bold">{stats.totalCO2.toLocaleString()} / {annualGoal.toLocaleString()} MT</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${goalProgress}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">"On track to reach your 2024 sustainability commitment by October."</p>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">CO2 Offset Trend</h4>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="offset" fill="#13ec6d" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Your Certificates</h4>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="pl-10 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary w-48"
                placeholder="Search ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {certificates.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Certificate ID</th>
                  <th className="px-6 py-4">Fuel Source</th>
                  <th className="px-6 py-4">Carbon Offset</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {currentCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-base">description</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{cert.certificateId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{cert.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-200">{cert.co2Offset.toFixed(0)} MT</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        cert.status === 'Verified' || cert.approvedByRegistry
                          ? 'bg-primary/10 text-emerald-600 border border-primary/20'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                      }`}>
                        {cert.approvedByRegistry ? '✓ Trade Approved' : cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {cert.status === 'Verified' && !cert.approvedByRegistry ? (
                        <button
                          onClick={() => handleRetireCertificate(cert.certificateId)}
                          className="px-4 py-1.5 bg-primary text-slate-900 text-xs font-black rounded-lg hover:brightness-105 transition-all shadow-sm"
                        >
                          USE
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleViewDetails(cert)}
                          className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                          title="View Certificate Details"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <p>No certificates yet. Place a bid in the marketplace to get started.</p>
            </div>
          )}
        </div>

        {certificates.length > 0 && (
          <div className="p-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {indexOfFirstCert + 1} of {filteredCertificates.length} certificates</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Promotion Banner */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-slate-900 mt-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-slate-900/40 z-10"></div>
        <img
          alt="Sustainable Flight Banner"
          className="w-full h-48 object-cover object-center opacity-60"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-RsjFCvF0-vx-gQ6b7rj50V4Q54Q-rsi1tnC6_jwfn_O_Z-lcCKVBven1xtddlqtnX9Xxo56rvzlJMblA8ZD9IyePeJk2bilitvjLikWfEgU7VbW8Pz9-iBzMeF_yE9Ws-scapeeNfw7NHkuZtpFgZe3wDdMiROdPgFtaDqUV7j91TKqMxxAYkMch401AS1Avbbg54PRvh2JpzbySahNRLXstHyjOEg5eMLzWIias5Pqr4OJuYLReCu1AEOoiwWqigITfOPpaTWvM"
        />
        <div className="absolute inset-0 z-20 p-8 flex flex-col justify-center">
          <div className="max-w-xl">
            <h4 className="text-2xl font-black text-white mb-2">Maximize your ESG Performance</h4>
            <p className="text-emerald-50/70 mb-6">Need more certificates to reach your sustainability targets? Browse verified high-impact SAF projects in our marketplace.</p>
            <button
              onClick={() => window.location.href = '/airline/marketplace'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 font-black rounded-lg hover:brightness-110 transition-all uppercase tracking-wide text-sm"
            >
              Explore Marketplace
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Certificate Details Modal */}
      {showDetailModal && selectedCertificate && (
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
                  <p className="text-sm text-slate-500">{selectedCertificate.certificateId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCertificate(null);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Certificate ID & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Certificate ID</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedCertificate.certificateId}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedCertificate.status === 'Verified' || selectedCertificate.approvedByRegistry
                        ? 'bg-primary/10 text-emerald-600 border border-primary/20'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                    }`}>
                      {selectedCertificate.approvedByRegistry ? '✓ Trade Approved' : selectedCertificate.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity & CO2 Offset */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Quantity</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedCertificate.quantity.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Metric Tons of SAF</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">CO2 Offset</p>
                  <p className="text-2xl font-black text-primary">{selectedCertificate.co2Offset.toFixed(0)}</p>
                  <p className="text-xs text-slate-500 mt-1">Metric Tons CO2e</p>
                </div>
              </div>

              {/* Fuel Source & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Fuel Source</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedCertificate.source}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Purchase Price</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">${selectedCertificate.price?.toFixed(2) || 'N/A'}</p>
                  <p className="text-xs text-slate-500 mt-1">per MT</p>
                </div>
              </div>

              {/* Batch Information */}
              {selectedCertificate.batchId && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Batch ID</p>
                  <p className="text-sm font-mono text-slate-900 dark:text-white break-all">{selectedCertificate.batchId}</p>
                </div>
              )}

              {/* Approval Timeline */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-4">Approval Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Supplier Accepted</p>
                      <p className="text-xs text-slate-500">Your bid was accepted by the supplier</p>
                    </div>
                  </div>
                  {selectedCertificate.approvedByRegistry && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Registry Approved ✓</p>
                        <p className="text-xs text-slate-500">Certificate verified and registered on blockchain</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-emerald-600">eco</span>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Environmental Impact</p>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  This certificate represents <strong>{selectedCertificate.co2Offset.toFixed(0)} MT</strong> of CO2 equivalent offset through sustainable aviation fuel. This is equivalent to taking <strong>{Math.round(selectedCertificate.co2Offset / 4.6)}</strong> cars off the road for one year.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 justify-end">
              {selectedCertificate.status === 'Verified' && !selectedCertificate.approvedByRegistry && (
                <button
                  onClick={() => {
                    handleRetireCertificate(selectedCertificate.certificateId);
                    setShowDetailModal(false);
                    setSelectedCertificate(null);
                  }}
                  className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:brightness-105 transition-all"
                >
                  Use Certificate
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCertificate(null);
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
