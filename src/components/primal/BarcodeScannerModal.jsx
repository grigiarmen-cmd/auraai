import React, { useState } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
const API_BASE = getApiBaseUrl();
import { QrCode, Search, AlertTriangle, ShieldCheck, BookOpen, MapPin, Sparkles, X, ChevronRight, ExternalLink } from 'lucide-react';

export default function BarcodeScannerModal({ isOpen, onClose, onOpenMapWithStore }) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'cellular' | 'studies' | 'alternatives'

  if (!isOpen) return null;

  const handleScanOrSubmit = async (codeToSearch) => {
    const code = codeToSearch || barcodeInput;
    if (!code) return;

    setIsLoading(true);
    setError(null);
    setProductData(null);

    try {
      const res = await fetch(`${API_BASE}/api/nutrition/barcode/${encodeURIComponent(code)}`);
      if (!res.ok) {
        throw new Error('Produkt konnte nicht gefunden werden oder Barcode ist ungültig.');
      }
      const data = await res.json();
      setProductData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictBadge = (verdict) => {
    if (verdict === 'PRIMAL_APPROVED') {
      return (
        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <ShieldCheck size={14} /> PRIMAL APPROVED
        </span>
      );
    }
    if (verdict === 'QUESTIONABLE') {
      return (
        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <AlertTriangle size={14} /> FRAGWÜRDIG
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse">
        <AlertTriangle size={14} /> TOXIC / SEED OIL HEAVY
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Aura Deep-Science Scanner <Sparkles size={16} className="text-amber-400" />
              </h2>
              <p className="text-xs text-zinc-400">Barcode-Scan & Zelluläre Toxizitätsanalyse</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/30">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Barcode eingeben (EAN-Nummer) oder Barcode vor die Kamera halten..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanOrSubmit()}
                className="w-full bg-zinc-900/90 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
              />
            </div>
            <button
              onClick={() => handleScanOrSubmit()}
              disabled={isLoading || !barcodeInput.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search size={18} /> Scannen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
              <AlertTriangle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Analysiere Biochemie & Inhaltsstoffe...</p>
                <p className="text-xs text-zinc-400">Zelluläre Mechanismen & Studien werden abgefragt</p>
              </div>
            </div>
          )}

          {productData && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Product Header Card */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex gap-4 items-center">
                {productData.imageUrl && (
                  <img 
                    src={productData.imageUrl} 
                    alt={productData.name} 
                    className="w-20 h-20 object-contain rounded-xl bg-white/5 p-1 border border-zinc-700/50"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{productData.brand || 'Markenprodukt'}</span>
                    {getVerdictBadge(productData.science?.verdict)}
                  </div>
                  <h3 className="text-lg font-bold text-white">{productData.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                        (productData.science?.auraScore || 0) >= 80 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' :
                        (productData.science?.auraScore || 0) >= 40 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
                        'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      }`} />
                      <span className="text-amber-400 font-bold">Aura-Score: {productData.science?.auraScore || 0}/100</span>
                    </div>
                    {productData.novaGroup && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">NOVA {productData.novaGroup}</span>
                    )}
                    {productData.nutrients?.calories && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-orange-300 font-semibold">{productData.nutrients.calories}</span>
                    )}
                    {productData.nutrients?.protein && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-emerald-300">{productData.nutrients.protein}</span>
                    )}
                    {productData.nutrients?.fat && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-amber-300">{productData.nutrients.fat}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detected Toxins Pill List */}
              {productData.detectedToxins && productData.detectedToxins.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xs font-semibold text-rose-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Erkannte Problemstoffe:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {productData.detectedToxins.map((toxin, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30">
                        {toxin}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Navigation */}
              <div className="flex border-b border-zinc-800 gap-2">
                {[
                  { id: 'summary', label: 'Zellwirkung & Zutaten', icon: AlertTriangle },
                  { id: 'hormones', label: 'Hormon- & Vitalitäts-Index', icon: Sparkles },
                  { id: 'studies', label: 'Studien & Quellen', icon: BookOpen },
                  { id: 'alternatives', label: 'Clean Alternativen & Stores', icon: MapPin },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === tab.id
                          ? 'border-amber-400 text-amber-400'
                          : 'border-transparent text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab: Cellular Breakdown */}
              {activeTab === 'summary' && (
                <div className="space-y-4 text-sm">
                  {/* Detailed Ingredients Breakdown List */}
                  {productData.science?.ingredientsBreakdown && productData.science.ingredientsBreakdown.length > 0 && (
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Sparkles size={14} /> Einzelne Zutaten im Detail-Scan:
                      </h4>
                      <div className="space-y-2">
                        {productData.science.ingredientsBreakdown.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">{item.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'TOXIC' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                item.status === 'SUSPECT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-snug">{item.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pros & Cons Grid */}
                  {productData.science?.ingredientsProsAndCons && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <ShieldCheck size={14} /> Vorteile & Nährstoff-Dichte:
                        </span>
                        <ul className="space-y-1 list-disc list-inside text-zinc-300">
                          {productData.science.ingredientsProsAndCons.pros?.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5">
                        <span className="font-bold text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Nachteile / Antinährstoffe:
                        </span>
                        <ul className="space-y-1 list-disc list-inside text-zinc-300">
                          {productData.science.ingredientsProsAndCons.cons?.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                      <Sparkles size={14} /> Zellulärer Mechanismus (Biochemie)
                    </h4>
                    <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                      {productData.science?.cellularMechanism}
                    </p>
                  </div>

                  {productData.science?.healthMinistryWarnings && (
                    <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
                        Behörden- & EFSA-Einstufung
                      </h4>
                      <p className="text-zinc-300 leading-relaxed text-xs">
                        {productData.science?.healthMinistryWarnings}
                      </p>
                    </div>
                  )}

                  {productData.science?.ancestralPerspective && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                        Ancestrale Perspektive (Aajonus / Weston Price)
                      </h4>
                      <p className="text-zinc-300 italic text-xs leading-relaxed">
                        "{productData.science?.ancestralPerspective}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Hormones & Vitality Index */}
              {activeTab === 'hormones' && (
                <div className="space-y-4 text-xs">
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Sparkles size={16} /> Hormon- & Steroidsynthese-Einfluss:
                    </h4>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {productData.science?.hormoneIndex?.testosteroneImpact || 'Keine hormonelle Dysregulation erkannt.'}
                    </p>
                    <p className="text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2">
                      {productData.science?.hormoneIndex?.vitalitySummary || 'Stabilisiert Energie- und Dopaminlevel.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Studies */}
              {activeTab === 'studies' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Peer-Reviewed Studien & DOIs:</h4>
                  {productData.science?.scientificStudies?.map((study, idx) => {
                    const doiClean = study.doi ? study.doi.replace(/^(doi:|pmid:|\s+)/gi, '').trim() : '';
                    const studyUrl = doiClean.startsWith('10.') 
                      ? `https://doi.org/${doiClean}` 
                      : (doiClean.match(/^\d+$/) ? `https://pubmed.ncbi.nlm.nih.gov/${doiClean}/` : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(study.journal + ' ' + study.finding)}`);

                    return (
                      <div key={idx} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 hover:border-amber-500/40 transition-colors">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-bold text-amber-400">{study.journal}</span>
                          <a
                            href={studyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[11px] flex items-center gap-1.5 transition-all border border-amber-500/20"
                            title="Studie auf PubMed / DOI öffnen"
                          >
                            <span>{study.doi || 'Studie ansehen'}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{study.finding}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Alternatives */}
              {activeTab === 'alternatives' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">
                    Statt dieses Produkts empfiehlt die Aura Engine folgende gesunde Alternativen aus Bio-Läden und Supermärkten:
                  </p>
                  <div className="grid gap-3">
                    {productData.science?.cleanAlternatives?.map((alt, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-white text-sm flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-400" /> {alt.name}
                          </h5>
                          <p className="text-xs text-emerald-300/80 mt-1">{alt.whyBetter}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10 text-xs">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <MapPin size={12} className="text-amber-400" /> {alt.whereToBuy}
                          </span>
                          {onOpenMapWithStore && (
                            <button 
                              onClick={() => onOpenMapWithStore(alt.whereToBuy)}
                              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                            >
                              Auf Karte finden <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
