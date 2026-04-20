/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import LZString from 'lz-string';
import { 
  Search, 
  BrainCircuit, 
  Zap, 
  Globe, 
  BookOpen, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  History,
  Settings,
  ChevronRight,
  Download,
  Copy,
  Check,
  Menu,
  X,
  Plus,
  RefreshCw,
  Bookmark,
  Trash2,
  SlidersHorizontal,
  FileText,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { geminiService, SearchFilters } from './services/geminiService';
import { cn } from './lib/utils';

type ViewMode = 'research' | 'synthesis' | 'refinement';

interface ResearchItem {
  id: string;
  query: string;
  researchContent?: string;
  synthesisContent?: string;
  status: 'idle' | 'searching' | 'synthesizing' | 'completed';
  isRefining?: boolean;
  isSaved?: boolean;
  timestamp?: number;
  filters?: SearchFilters;
  autoSummary?: string;
}

const StatusIcon = ({ item }: { item: ResearchItem }) => {
  if (item.isRefining) return <Zap className="w-3.5 h-3.5 animate-pulse text-amber-500 flex-shrink-0" />;
  if (item.status === 'searching') return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 flex-shrink-0" />;
  if (item.status === 'synthesizing') return <BrainCircuit className="w-3.5 h-3.5 animate-pulse text-violet-500 flex-shrink-0" />;
  if (item.status === 'completed') return <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
  return <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
};

export default function App() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ResearchItem[]>(() => {
    try {
      const saved = localStorage.getItem('insight_engine_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('research');
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    timeFrame: 'any',
    sourceType: 'all',
    relevance: 'standard'
  });

  useEffect(() => {
    localStorage.setItem('insight_engine_history', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const compressedData = hash.substring(7);
        const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
        if (decompressed) {
          const sharedItem = JSON.parse(decompressed);
          sharedItem.id = crypto.randomUUID(); 
          sharedItem.isSaved = true; 
          
          setItems(prev => {
            // Prevent duplicate insertion if clicked multiple times
            if (prev.some(i => i.query === sharedItem.query && i.timestamp === sharedItem.timestamp)) return prev;
            return [sharedItem, ...prev];
          });
          setOpenIds(prev => [...prev, sharedItem.id]);
          setActiveId(sharedItem.id);
          setViewMode('research');
          
          // Clear hash securely
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch(e) {
        console.error("Failed to parse shared item URL", e);
      }
    }
  }, []);

  const activeItem = items.find(i => i.id === activeId) || null;
  const isProcessing = activeItem?.status === 'searching' || activeItem?.status === 'synthesizing' || activeItem?.isRefining;

  const executeResearch = async (searchQuery: string, existingId?: string) => {
    if (!searchQuery.trim()) return;

    const targetId = existingId || crypto.randomUUID();
    const activeFilters = existingId 
      ? items.find(i => i.id === existingId)?.filters || searchFilters 
      : searchFilters;
    
    if (!existingId) {
      const newItem: ResearchItem = {
        id: targetId,
        query: searchQuery,
        status: 'searching',
        timestamp: Date.now(),
        filters: activeFilters
      };
      setItems(prev => [newItem, ...prev]);
      setOpenIds(prev => prev.includes(targetId) ? prev : [...prev, targetId]);
      setActiveId(targetId);
      setQuery('');
      setShowFilters(false);
    } else {
      setItems(prev => prev.map(item => 
        item.id === targetId ? { ...item, status: 'searching', researchContent: undefined, synthesisContent: undefined } : item
      ));
    }

    try {
      const result = await geminiService.research(searchQuery, activeFilters);
      setItems(prev => prev.map(item => 
        item.id === targetId ? { ...item, researchContent: result, status: 'completed' } : item
      ));

      // Generate Auto-Summary asynchronously
      geminiService.quickAction(result, "Provide a concise 2-3 sentence executive summary of these latest findings.")
        .then(summary => {
          setItems(prev => prev.map(item => 
            item.id === targetId ? { ...item, autoSummary: summary } : item
          ));
        })
        .catch(err => console.error("Auto-summary failed", err));

    } catch (error) {
      console.error('Research failed', error);
      setItems(prev => prev.map(item => 
        item.id === targetId ? { ...item, status: 'idle' } : item
      ));
    }
  };

  const startResearch = () => executeResearch(query);

  const startSynthesis = async () => {
    if (!activeItem?.researchContent || isProcessing) return;
    const itemId = activeItem.id;

    setItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'synthesizing' } : item));

    try {
      const result = await geminiService.synthesize(activeItem.researchContent, "Provide a comprehensive synthesis focusing on strategic insights and future implications.");
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, synthesisContent: result, status: 'completed' } : item));
      setViewMode('synthesis');
    } catch (error) {
      console.error('Synthesis failed', error);
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, status: 'completed' } : item));
    }
  };

  const runQuickAction = async (action: string) => {
    if (!activeItem || isProcessing || activeItem.isRefining) return;
    const content = viewMode === 'research' ? activeItem.researchContent : activeItem.synthesisContent;
    if (!content) return;

    const itemId = activeItem.id;
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, isRefining: true } : item));

    try {
      const result = await geminiService.quickAction(content, action);
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return viewMode === 'research' 
            ? { ...item, researchContent: result, isRefining: false }
            : { ...item, synthesisContent: result, isRefining: false };
        }
        return item;
      }));
    } catch (error) {
      console.error('Quick action failed', error);
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, isRefining: false } : item));
    }
  };

  const closeTab = (id: string) => {
    setOpenIds(prev => prev.filter(tabId => tabId !== id));
    if (activeId === id) {
      const remaining = openIds.filter(tabId => tabId !== id);
      setActiveId(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleCopy = () => {
    const content = viewMode === 'research' ? activeItem?.researchContent : activeItem?.synthesisContent;
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = viewMode === 'research' ? activeItem?.researchContent : activeItem?.synthesisContent;
    if (!content || !activeItem) return;
    
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${activeItem.query.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${viewMode}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = () => {
    if (!activeItem) return;
    const itemToShare = { ...activeItem, id: undefined, status: 'completed', isRefining: false }; 
    const encoded = LZString.compressToEncodedURIComponent(JSON.stringify(itemToShare));
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const toggleSave = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isSaved: !item.isSaved } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    closeTab(id);
  };

  const exportAllSaved = () => {
    const savedItems = items.filter(i => i.isSaved);
    savedItems.forEach((item, index) => {
      setTimeout(() => {
        const content = [
          `# ${item.query}`,
          item.filters && (item.filters.timeFrame !== 'any' || item.filters.sourceType !== 'all' || item.filters.relevance !== 'standard') 
            ? `\n**Filters:** Time: ${item.filters.timeFrame}, Source: ${item.filters.sourceType}, Relevance: ${item.filters.relevance}` : '',
          `\n\n## Research Data\n`,
          item.researchContent || '*No research data available.*',
          `\n\n## AI Synthesis\n`,
          item.synthesisContent || '*No synthesis data available.*'
        ].filter(Boolean).join('');
        
        const element = document.createElement("a");
        const file = new Blob([content], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = `${item.query.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-export.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }, index * 300);
    });
  };

  return (
    <div className="flex h-screen bg-[#FBFBFB] text-slate-900 font-sans selection:bg-blue-100 overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-lg tracking-tight">InsightEngine</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="md:hidden p-1 -mr-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={() => { setActiveId(null); setViewMode('research'); setQuery(''); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            New Research
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.filter(i => i.isSaved).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 px-2 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Bookmark className="w-3.5 h-3.5" />
                Saved Projects
              </div>
              <div className="space-y-1">
                {items.filter(i => i.isSaved).sort((a,b) => (b.timestamp||0) - (a.timestamp||0)).map((item) => (
                  <div key={item.id} className="group relative flex items-center">
                    <button
                      onClick={() => { 
                        if (!openIds.includes(item.id)) setOpenIds(prev => [...prev, item.id]);
                        setActiveId(item.id); 
                        setViewMode('research'); 
                        setIsMobileMenuOpen(false); 
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all border border-transparent pr-16",
                        activeId === item.id 
                          ? "bg-blue-50 text-blue-700 border-blue-100" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        <StatusIcon item={item} />
                        <span className="truncate">{item.query}</span>
                      </div>
                    </button>
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button onClick={() => toggleSave(item.id)} className="p-1 text-slate-400 hover:text-amber-500 transition-colors">
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 px-2 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <History className="w-3.5 h-3.5" />
              Recent History
            </div>
            <div className="space-y-1">
              {items.filter(i => !i.isSaved).sort((a,b) => (b.timestamp||0) - (a.timestamp||0)).map((item) => (
                <div key={item.id} className="group relative flex items-center">
                  <button
                    onClick={() => { 
                      if (!openIds.includes(item.id)) setOpenIds(prev => [...prev, item.id]);
                      setActiveId(item.id); 
                      setViewMode('research'); 
                      setIsMobileMenuOpen(false); 
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-all border border-transparent pr-16",
                      activeId === item.id 
                        ? "bg-blue-50 text-blue-700 border-blue-100" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <StatusIcon item={item} />
                      <span className="truncate">{item.query}</span>
                    </div>
                  </button>
                  <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleSave(item.id)} className="p-1 text-slate-400 hover:text-slate-700 transition-colors" title="Save Project">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Delete record">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {items.filter(i => !i.isSaved).length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-400 italic">No recent history</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
          {items.some(i => i.isSaved) && (
            <button 
              onClick={exportAllSaved} 
              className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export All Saved
            </button>
          )}
          <button className="flex items-center gap-3 px-3 py-2 w-full text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#FBFBFB]">
        <header className="shrink-0 min-h-16 h-auto border-b border-slate-100 bg-white flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 w-full overflow-hidden z-10">
          <div className="flex items-center h-14 md:h-16 w-full md:w-auto overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden mr-3 p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 md:gap-6 whitespace-nowrap">
              <button 
                onClick={() => setViewMode('research')}
                className={cn(
                  "text-sm font-medium transition-colors relative py-4 lg:py-5 min-w-[100px]",
                  viewMode === 'research' ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Research Data
                {viewMode === 'research' && <motion.div layoutId="header-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
              <button 
                onClick={() => setViewMode('synthesis')}
                className={cn(
                  "text-sm font-medium transition-colors relative py-4 lg:py-5 min-w-[100px]",
                  viewMode === 'synthesis' ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
                )}
              >
                AI Synthesis
                {viewMode === 'synthesis' && <motion.div layoutId="header-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pb-3 md:pb-0 pt-1 md:pt-0">
            {activeItem && (
              <div className="flex items-center gap-1 border-r border-slate-100 pr-2 mr-1 md:mr-2 flex-shrink-0">
                <button 
                  onClick={() => runQuickAction('Summarize as key bullet points')}
                  disabled={isProcessing}
                  className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  title="Quick Summary"
                >
                  <Zap className="w-3 h-3 flex-shrink-0" />
                  <span>Summarize</span>
                </button>
                <button 
                  onClick={() => runQuickAction('Simplify language for a general audience')}
                  disabled={isProcessing}
                  className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  title="Simplify Content"
                >
                  <Sparkles className="w-3 h-3 flex-shrink-0" />
                  <span>Simplify</span>
                </button>
              </div>
            )}
            {activeItem && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button 
                onClick={() => executeResearch(activeItem.query, activeItem.id)}
                disabled={isProcessing}
                className="p-2 text-slate-400 hover:text-blue-600 justify-center hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50"
                title="Re-run Query"
              >
                <RefreshCw className={cn("w-4 h-4", activeItem.status === 'searching' && "animate-spin text-blue-600")} />
              </button>
              <button 
                onClick={() => toggleSave(activeItem.id)}
                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded-lg transition-all"
                title={activeItem.isSaved ? "Unsave Project" : "Save Project"}
              >
                <Bookmark className={cn("w-4 h-4", activeItem.isSaved && "fill-current text-amber-500")} />
              </button>
              <button 
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                title="Copy Share Link"
              >
                {shareCopied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleDownload}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all" 
                title="Download report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
          </div>
        </header>

        {/* Tab Row */}
        {openIds.length > 0 && (
          <div className="shrink-0 flex items-center bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide px-2 gap-1 pt-2">
            {openIds.map(id => {
              const item = items.find(i => i.id === id);
              if (!item) return null;
              const isActive = activeId === id;
              return (
                <div 
                  key={id} 
                  onClick={() => { setActiveId(id); setViewMode('research'); }} 
                  className={cn(
                    "group flex items-center gap-2 px-4 py-2 border-t border-x rounded-t-lg cursor-pointer text-sm max-w-[200px] min-w-[120px] transition-all", 
                    isActive ? "bg-white border-slate-200 text-blue-600 font-medium relative top-[1px]" : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {(item.status === 'searching' || item.status === 'synthesizing' || item.isRefining) && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                  <span className="truncate flex-1">{item.query}</span>
                  <button onClick={(e) => { e.stopPropagation(); closeTab(id); }} className={cn("p-1.5 -mr-1.5 rounded-md hover:bg-slate-200 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700")}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
            <button onClick={() => { setActiveId(null); setQuery(''); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors ml-1 mb-1" title="New Tab">
               <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-12 w-full">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 md:py-12">
            {!activeItem ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 md:mt-20 text-center"
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Search className="w-8 h-8" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight px-2">What do you want to research today?</h1>
                <p className="text-sm md:text-base text-slate-500 mb-8 max-w-md mx-auto px-4">
                  Powered by real-time Google Search and high-thinking AI to provide you with the deepest insights available.
                </p>
                
                <div className="relative max-w-xl mx-auto w-full px-2 md:px-0">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startResearch()}
                    placeholder="Enter a topic, industry, or landscape..."
                    className="w-full pl-5 md:pl-6 pr-[150px] md:pr-[190px] py-4 bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base md:text-lg"
                  />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    title="Search Filters"
                    className={cn(
                      "absolute right-[100px] md:right-[130px] top-2 md:top-2 h-10 md:h-12 w-10 md:w-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-all",
                      showFilters || searchFilters.timeFrame !== 'any' || searchFilters.sourceType !== 'all' || searchFilters.relevance !== 'standard'
                        ? "bg-blue-100 text-blue-700" 
                        : "text-slate-400 hover:text-blue-600 hover:bg-slate-50"
                    )}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={startResearch}
                    disabled={!query.trim()}
                    className="absolute right-3 top-2 md:top-2 h-10 md:h-12 px-4 md:px-6 bg-blue-600 text-white rounded-xl md:rounded-2xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <span className="hidden sm:inline">Analyze</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="overflow-hidden mt-3 absolute left-0 right-0 z-20 px-2 md:px-0"
                      >
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg shadow-slate-200/50 flex flex-col md:flex-row gap-4">
                          <div className="flex-1 space-y-1.5 hidden sm:block md:hidden lg:block">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-1">Date Range</label>
                            <select 
                              value={searchFilters.timeFrame}
                              onChange={(e) => setSearchFilters(f => ({...f, timeFrame: e.target.value as any}))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 appearance-none"
                            >
                              <option value="any">Any time</option>
                              <option value="24h">Past 24 hours</option>
                              <option value="7d">Past week</option>
                              <option value="1m">Past month</option>
                              <option value="1y">Past year</option>
                            </select>
                          </div>
                          <div className="flex-1 space-y-1.5 block sm:hidden md:block lg:hidden">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date Range</label>
                             </div>
                             <select 
                              value={searchFilters.timeFrame}
                              onChange={(e) => setSearchFilters(f => ({...f, timeFrame: e.target.value as any}))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 appearance-none"
                            >
                              <option value="any">Any time</option>
                              <option value="24h">Past 24 hours</option>
                              <option value="7d">Past week</option>
                              <option value="1m">Past month</option>
                              <option value="1y">Past year</option>
                            </select>
                          </div>
                          
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-1">Source Type</label>
                            <select 
                              value={searchFilters.sourceType}
                              onChange={(e) => setSearchFilters(f => ({...f, sourceType: e.target.value as any}))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 appearance-none"
                            >
                              <option value="all">Everywhere</option>
                              <option value="news">News & Media</option>
                              <option value="academic">Academic & Edu</option>
                              <option value="government">Government (.gov)</option>
                            </select>
                          </div>
                          
                          <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-1">Relevance Score</label>
                            <select 
                              value={searchFilters.relevance}
                              onChange={(e) => setSearchFilters(f => ({...f, relevance: e.target.value as any}))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 appearance-none"
                            >
                              <option value="standard">Standard (All)</option>
                              <option value="high">High (&gt; 8/10)</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto px-4">

                  {[
                    { icon: Globe, label: "Market Trends", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { icon: BookOpen, label: "Literature Review", color: "text-blue-600", bg: "bg-blue-50" },
                    { icon: Sparkles, label: "Pattern Discovery", color: "text-amber-600", bg: "bg-amber-50" },
                  ].map((feat) => (
                    <div key={feat.label} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all text-left">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", feat.bg)}>
                        <feat.icon className={cn("w-5 h-5", feat.color)} />
                      </div>
                      <div className="font-semibold text-sm mb-1">{feat.label}</div>
                      <div className="text-xs text-slate-500 font-mono italic">Enabled</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-blue-600 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">
                      <Zap className="w-3 md:w-3.5 h-3 md:h-3.5 fill-current" />
                      Active Analysis
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">{activeItem.query}</h2>
                    
                    {activeItem.filters && (activeItem.filters.timeFrame !== 'any' || activeItem.filters.sourceType !== 'all' || activeItem.filters.relevance !== 'standard') && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {activeItem.filters.timeFrame !== 'any' && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {activeItem.filters.timeFrame === '24h' ? 'Past 24h' : activeItem.filters.timeFrame === '7d' ? 'Past 7 days' : activeItem.filters.timeFrame === '1m' ? 'Past month' : 'Past year'}
                          </span>
                        )}
                        {activeItem.filters.sourceType !== 'all' && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {activeItem.filters.sourceType}
                          </span>
                        )}
                        {activeItem.filters.relevance === 'high' && (
                          <span className="px-2 py-1 border-amber-200 bg-amber-50 text-amber-700 border rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Highly Relevant
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {activeItem.status === 'searching' && (
                    <div className="flex items-center self-start gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 whitespace-nowrap">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching Google...
                    </div>
                  )}

                  {activeItem.status === 'synthesizing' && (
                    <div className="flex items-center self-start gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100 whitespace-nowrap">
                      <BrainCircuit className="w-3 h-3 animate-pulse" />
                      Deep Thinking...
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm">
                  <AnimatePresence mode="wait">
                    {viewMode === 'research' ? (
                      <motion.div 
                        key="research"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="prose prose-sm md:prose-base prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-img:rounded-xl overflow-x-hidden"
                      >
                        {activeItem.researchContent ? (
                          <>
                            {activeItem.autoSummary && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm text-slate-800"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="w-5 h-5 text-blue-600" />
                                  <h3 className="font-bold text-lg m-0 text-slate-900 leading-none">Executive Summary</h3>
                                </div>
                                <p className="text-[15px] leading-relaxed m-0">{activeItem.autoSummary}</p>
                              </motion.div>
                            )}
                            <ReactMarkdown>{activeItem.researchContent}</ReactMarkdown>
                            {!activeItem.synthesisContent && activeItem.status !== 'synthesizing' && (
                              <div className="mt-8 md:mt-12 p-5 md:p-6 border border-slate-200 border-dashed rounded-xl md:rounded-2xl flex flex-col items-center text-center">
                                <BrainCircuit className="w-8 h-8 md:w-10 md:h-10 text-slate-300 mb-3 md:mb-4" />
                                <h3 className="font-bold text-slate-900 mb-2">Ready for Deep Synthesis?</h3>
                                <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6 max-w-sm px-2">
                                  Use High Thinking mode to extract underlying patterns, strategic insights, and future trajectories from this data.
                                </p>
                                <button 
                                  onClick={startSynthesis}
                                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                                >
                                  Deploy High Thinking
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-16 md:py-20 flex flex-col items-center gap-4 text-slate-400">
                            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
                            <div className="font-mono text-xs md:text-sm tracking-tighter uppercase font-bold text-center">Retrieving Search Data<br />Scanning the web...</div>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="synthesis"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="prose prose-sm md:prose-base prose-blue max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed overflow-x-hidden"
                      >
                        {activeItem.synthesisContent ? (
                          <ReactMarkdown>{activeItem.synthesisContent}</ReactMarkdown>
                        ) : activeItem.status === 'synthesizing' ? (
                          <div className="py-20 flex flex-col items-center gap-6">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-blue-50 rounded-full" />
                              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-slate-900 mb-1">Activating Neural Synthesis</div>
                              <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Applying High Thinking Parameters</div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-20 text-center text-slate-400 font-medium">
                            No synthesis available. Run Deep Synthesis from the Research tab to unlock strategic insights.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
