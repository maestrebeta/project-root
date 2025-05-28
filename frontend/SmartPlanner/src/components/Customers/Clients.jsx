import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientsTable from './ClientsTable';

export default function Clients() {
  const [activeView, setActiveView] = useState('resumen');
  const [stats, setStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para análisis inteligente
  const [clientInsights, setClientInsights] = useState({});
  const [revenueAnalysis, setRevenueAnalysis] = useState({});
  const [marketIntelligence, setMarketIntelligence] = useState({});
  const [strategicRecommendations, setStrategicRecommendations] = useState([]);

  useEffect(() => {
    if (activeView === 'resumen') {
      fetchAllData();
    }
  }, [activeView]);

  const getAuthHeaders = () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };
    } catch (error) {
      throw new Error('Error de autenticación');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchStats(),
        fetchClientAnalytics(),
        fetchClientInsights(),
        fetchRevenueAnalysis(),
        fetchMarketIntelligence()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8000/clients/stats', { headers });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchClientAnalytics = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8000/clients/analytics', { headers });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        generateStrategicRecommendations(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchClientInsights = async () => {
    // Simulación de insights inteligentes de clientes
    const insights = {
      clientLifecycleAnalysis: {
        avgAcquisitionCost: 2500,
        avgLifetimeValue: 45000,
        churnRate: 8.5,
        retentionRate: 91.5,
        growthRate: 23.4
      },
      segmentPerformance: [
        { segment: 'Enterprise', clients: 12, revenue: 850000, growth: '+15%', satisfaction: 4.8 },
        { segment: 'Corporate', clients: 28, revenue: 620000, growth: '+8%', satisfaction: 4.5 },
        { segment: 'Small Business', clients: 45, revenue: 280000, growth: '+25%', satisfaction: 4.2 },
        { segment: 'Startup', clients: 18, revenue: 95000, growth: '+40%', satisfaction: 4.0 }
      ],
      riskAnalysis: {
        highRiskClients: 3,
        mediumRiskClients: 7,
        lowRiskClients: 93,
        churnPrediction: [
          { clientName: 'TechCorp Ltd', risk: 85, reason: 'Reducción en proyectos' },
          { clientName: 'StartupXYZ', risk: 72, reason: 'Retrasos en pagos' }
        ]
      },
      opportunityMatrix: {
        upsellOpportunities: 15,
        crossSellOpportunities: 23,
        renewalOpportunities: 8,
        expansionPotential: '$320,000'
      }
    };
    setClientInsights(insights);
  };

  const fetchRevenueAnalysis = async () => {
    // Simulación de análisis de ingresos avanzado
    const analysis = {
      revenueStreams: [
        { stream: 'Desarrollo de Software', revenue: 1200000, percentage: 45, trend: '+12%' },
        { stream: 'Consultoría', revenue: 800000, percentage: 30, trend: '+8%' },
        { stream: 'Soporte y Mantenimiento', revenue: 450000, percentage: 17, trend: '+5%' },
        { stream: 'Capacitación', revenue: 200000, percentage: 8, trend: '+25%' }
      ],
      profitabilityAnalysis: {
        grossMargin: 68.5,
        netMargin: 22.3,
        avgProjectMargin: 35.7,
        costPerAcquisition: 2500,
        revenuePerEmployee: 125000
      },
      forecastAccuracy: {
        q1Accuracy: 94.2,
        q2Accuracy: 89.7,
        q3Accuracy: 91.5,
        q4Forecast: 2850000,
        confidenceLevel: 87
      }
    };
    setRevenueAnalysis(analysis);
  };

  const fetchMarketIntelligence = async () => {
    // Simulación de inteligencia de mercado
    const intelligence = {
      competitivePosition: {
        marketShare: 12.5,
        competitorAnalysis: [
          { competitor: 'CompetitorA', marketShare: 18.2, strength: 'Precio' },
          { competitor: 'CompetitorB', marketShare: 15.7, strength: 'Tecnología' },
          { competitor: 'CompetitorC', marketShare: 14.1, strength: 'Experiencia' }
        ]
      },
      industryTrends: [
        { trend: 'Transformación Digital', impact: 'high', opportunity: 85 },
        { trend: 'Cloud Computing', impact: 'high', opportunity: 78 },
        { trend: 'AI/ML Integration', impact: 'medium', opportunity: 65 },
        { trend: 'Cybersecurity', impact: 'high', opportunity: 92 }
      ],
      marketOpportunities: {
        emergingMarkets: ['HealthTech', 'FinTech', 'EdTech'],
        untappedSegments: ['Government', 'Non-Profit'],
        growthPotential: '$1.2M',
        timeToMarket: '6-9 months'
      }
    };
    setMarketIntelligence(intelligence);
  };

  const generateStrategicRecommendations = (data) => {
    const recommendations = [
      {
        type: 'growth',
        priority: 'high',
        title: 'Estrategia de Clientes Premium',
        description: 'Desarrollar programa de cuentas clave',
        action: 'Implementar estrategia de upselling dirigida',
        impact: 'Incremento potencial de 40-60% en ingresos por cliente',
        timeline: '3-6 meses'
      },
      {
        type: 'retention',
        priority: 'high',
        title: 'Programa de Retención Proactiva',
        description: 'Sistema de alerta temprana para riesgo de churn',
        action: 'Crear dashboard de salud del cliente',
        impact: 'Reducción del 25% en tasa de abandono',
        timeline: '2-4 meses'
      },
      {
        type: 'expansion',
        priority: 'medium',
        title: 'Diversificación de Servicios',
        description: 'Oportunidad en mercados emergentes',
        action: 'Desarrollar capacidades especializadas',
        impact: 'Nuevo flujo de ingresos de $500K-1M anual',
        timeline: '6-12 meses'
      },
      {
        type: 'optimization',
        priority: 'medium',
        title: 'Optimización de Márgenes',
        description: 'Margen neto actual del 22.3% puede mejorarse',
        action: 'Automatizar procesos y optimizar costos',
        impact: 'Incremento de 3-5 puntos en margen neto',
        timeline: '4-8 meses'
      }
    ];
    setStrategicRecommendations(recommendations);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRecommendationIcon = (type) => {
    const icons = {
      growth: '📈',
      retention: '🛡️',
      expansion: '🌍',
      optimization: '⚙️'
    };
    return icons[type] || '💡';
  };

  const getRiskColor = (risk) => {
    if (risk >= 80) return 'text-red-600 bg-red-50';
    if (risk >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderIntelligentSummary = () => (
    <div className="space-y-8">
      {/* Header Ejecutivo */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Centro de Inteligencia de Clientes</h2>
            <p className="text-green-100">Análisis avanzado de valor, retención y oportunidades de crecimiento</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.total_clients?.value || '0'}</div>
            <div className="text-sm text-green-100">Clientes Activos</div>
          </div>
        </div>
      </div>

      {/* Métricas Clave de Negocio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor de Vida del Cliente</p>
              <p className="text-2xl font-bold text-gray-900">${clientInsights.clientLifecycleAnalysis?.avgLifetimeValue?.toLocaleString()}</p>
              <p className="text-sm text-green-600">ROI: 18x</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Retención</p>
              <p className="text-2xl font-bold text-gray-900">{clientInsights.clientLifecycleAnalysis?.retentionRate}%</p>
              <p className="text-sm text-green-600">+2.3% vs industria</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crecimiento Anual</p>
              <p className="text-2xl font-bold text-gray-900">{clientInsights.clientLifecycleAnalysis?.growthRate}%</p>
              <p className="text-sm text-green-600">Superando objetivos</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Oportunidades de Expansión</p>
              <p className="text-2xl font-bold text-gray-900">{clientInsights.opportunityMatrix?.expansionPotential}</p>
              <p className="text-sm text-blue-600">{clientInsights.opportunityMatrix?.upsellOpportunities} oportunidades</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Análisis de Segmentos y Riesgo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Rendimiento por Segmento</h3>
          <div className="space-y-4">
            {clientInsights.segmentPerformance?.map((segment, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{segment.segment}</span>
                  <span className="text-sm text-green-600 font-semibold">{segment.growth}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Clientes</div>
                    <div className="font-semibold">{segment.clients}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Ingresos</div>
                    <div className="font-semibold">${(segment.revenue / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Satisfacción</div>
                    <div className="font-semibold">{segment.satisfaction}/5</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Análisis de Riesgo</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{clientInsights.riskAnalysis?.highRiskClients}</div>
                <div className="text-sm text-red-600">Alto Riesgo</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{clientInsights.riskAnalysis?.mediumRiskClients}</div>
                <div className="text-sm text-yellow-600">Riesgo Medio</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{clientInsights.riskAnalysis?.lowRiskClients}%</div>
                <div className="text-sm text-green-600">Bajo Riesgo</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Predicción de Churn</h4>
              {clientInsights.riskAnalysis?.churnPrediction?.map((client, index) => (
                <div key={index} className={`p-3 rounded-lg ${getRiskColor(client.risk)}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{client.clientName}</span>
                    <span className="text-sm font-semibold">{client.risk}% riesgo</span>
                  </div>
                  <div className="text-sm opacity-75">{client.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Análisis de Ingresos */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💼 Análisis de Flujos de Ingresos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueAnalysis.revenueStreams?.map((stream, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{stream.stream}</div>
              <div className="text-xl font-bold text-gray-900">${(stream.revenue / 1000).toFixed(0)}K</div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">{stream.percentage}%</span>
                <span className="text-sm text-green-600 font-semibold">{stream.trend}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{revenueAnalysis.profitabilityAnalysis?.grossMargin}%</div>
            <div className="text-sm text-gray-600">Margen Bruto</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{revenueAnalysis.profitabilityAnalysis?.netMargin}%</div>
            <div className="text-sm text-gray-600">Margen Neto</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${revenueAnalysis.profitabilityAnalysis?.costPerAcquisition}</div>
            <div className="text-sm text-gray-600">CAC</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${(revenueAnalysis.profitabilityAnalysis?.revenuePerEmployee / 1000).toFixed(0)}K</div>
            <div className="text-sm text-gray-600">Ingresos/Empleado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{revenueAnalysis.forecastAccuracy?.confidenceLevel}%</div>
            <div className="text-sm text-gray-600">Precisión Forecast</div>
          </div>
        </div>
      </div>

      {/* Inteligencia de Mercado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Posición Competitiva</h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{marketIntelligence.competitivePosition?.marketShare}%</div>
              <div className="text-sm text-blue-600">Cuota de Mercado</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Análisis Competitivo</h4>
              {marketIntelligence.competitivePosition?.competitorAnalysis?.map((comp, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{comp.competitor}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{comp.marketShare}%</div>
                    <div className="text-xs text-gray-500">{comp.strength}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Tendencias e Innovación</h3>
          <div className="space-y-3">
            {marketIntelligence.industryTrends?.map((trend, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{trend.trend}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    trend.impact === 'high' ? 'bg-red-100 text-red-800' : 
                    trend.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {trend.impact === 'high' ? 'Alto' : trend.impact === 'medium' ? 'Medio' : 'Bajo'} Impacto
                  </span>
                </div>
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${trend.opportunity}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Oportunidad: {trend.opportunity}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recomendaciones Estratégicas */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Recomendaciones Estratégicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategicRecommendations.map((rec, index) => (
            <motion.div
              key={index}
              className={`p-4 rounded-lg border-2 ${getPriorityColor(rec.priority)}`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getRecommendationIcon(rec.type)}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{rec.title}</h4>
                  <p className="text-xs mb-2 opacity-90">{rec.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Acción: {rec.action}</p>
                    <p className="text-xs opacity-75">Impacto: {rec.impact}</p>
                    <p className="text-xs opacity-75">Timeline: {rec.timeline}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Oportunidades de Mercado */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">🌟 Oportunidades de Mercado</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Mercados Emergentes</h4>
            <div className="space-y-1">
              {marketIntelligence.marketOpportunities?.emergingMarkets?.map((market, index) => (
                <span key={index} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs mr-1">
                  {market}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Segmentos Sin Explotar</h4>
            <div className="space-y-1">
              {marketIntelligence.marketOpportunities?.untappedSegments?.map((segment, index) => (
                <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">
                  {segment}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-2">Potencial de Crecimiento</h4>
            <div className="text-2xl font-bold text-purple-900">{marketIntelligence.marketOpportunities?.growthPotential}</div>
            <div className="text-sm text-purple-700">En {marketIntelligence.marketOpportunities?.timeToMarket}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'resumen', label: '🧠 Inteligencia de Clientes', icon: '📊' },
          { key: 'tabla', label: '👥 Gestión de Clientes', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeView === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'resumen' && renderIntelligentSummary()}
          {activeView === 'tabla' && <ClientsTable />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 