"use client";

import { useState } from "react";
import { 
  Coins, ArrowRight, ShieldAlert, CheckCircle2, Loader2, RefreshCw, 
  HelpCircle, Info, Landmark, Network, ArrowDownUp, ShieldCheck 
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Node {
  id: string;
  name: string;
  location: string;
  currency: "DZD" | "EUR";
  liquidity: number;
  targetCapacity: number;
  status: "ACTIVE" | "REBALANCING" | "SYNCING";
  ipAddress: string;
  lastSync: string;
}

const INITIAL_NODES: Node[] = [
  {
    id: "node-alg",
    name: "Algiers Hub Node",
    location: "Algiers, DZ",
    currency: "DZD",
    liquidity: 4850000,
    targetCapacity: 5000000,
    status: "ACTIVE",
    ipAddress: "197.200.44.12",
    lastSync: "Just now",
  },
  {
    id: "node-orn",
    name: "Oran Branch Node",
    location: "Oran, DZ",
    currency: "DZD",
    liquidity: 1250000,
    targetCapacity: 3000000,
    status: "ACTIVE",
    ipAddress: "197.200.48.85",
    lastSync: "3 mins ago",
  },
  {
    id: "node-cst",
    name: "Constantine Node",
    location: "Constantine, DZ",
    currency: "DZD",
    liquidity: 750000,
    targetCapacity: 2000000,
    status: "ACTIVE",
    ipAddress: "197.200.52.19",
    lastSync: "12 mins ago",
  },
  {
    id: "node-par",
    name: "Paris Gateway",
    location: "Paris, FR (Euro Hub)",
    currency: "EUR",
    liquidity: 24500,
    targetCapacity: 30000,
    status: "ACTIVE",
    ipAddress: "162.19.244.110",
    lastSync: "Just now",
  },
  {
    id: "node-strp",
    name: "Stripe Online Node",
    location: "Cloud Gateway (Global)",
    currency: "EUR",
    liquidity: 41200,
    targetCapacity: 50000,
    status: "ACTIVE",
    ipAddress: "34.250.99.102",
    lastSync: "1 min ago",
  },
];

interface LedgerItem {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  amount: number;
  currency: string;
  fee: number;
  priority: "LOW" | "NORMAL" | "HIGH";
  status: "SUCCESS" | "PENDING" | "FAILED";
  txHash: string;
}

const INITIAL_LEDGER: LedgerItem[] = [
  {
    id: "tx-88210",
    timestamp: "2026-06-01 10:14",
    source: "Algiers Hub Node",
    destination: "Oran Branch Node",
    amount: 1500000,
    currency: "DZD",
    fee: 150,
    priority: "NORMAL",
    status: "SUCCESS",
    txHash: "0x8fa9b2c8...ef91",
  },
  {
    id: "tx-88195",
    timestamp: "2026-06-01 08:32",
    source: "Stripe Online Node",
    destination: "Paris Gateway",
    amount: 12000,
    currency: "EUR",
    fee: 4.5,
    priority: "HIGH",
    status: "SUCCESS",
    txHash: "0x3bc7d1fa...11c2",
  },
  {
    id: "tx-88102",
    timestamp: "2026-05-31 16:45",
    source: "Constantine Node",
    destination: "Algiers Hub Node",
    amount: 500000,
    currency: "DZD",
    fee: 50,
    priority: "LOW",
    status: "SUCCESS",
    txHash: "0x7d91e60b...bb84",
  },
];

export default function TreasuryRebalancingPage() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [ledger, setLedger] = useState<LedgerItem[]>(INITIAL_LEDGER);
  
  // Form states
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH">("NORMAL");
  const [simulate, setSimulate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derive source & destination nodes
  const sourceNode = nodes.find(n => n.id === sourceId);
  const destNode = nodes.find(n => n.id === destId);
  const amount = Number(amountStr) || 0;

  // Currencies match check
  const isCurrencyMatch = sourceNode && destNode ? sourceNode.currency === destNode.currency : true;

  // Calculate estimated fees
  const calculateFee = () => {
    if (!amount) return 0;
    const baseRate = priority === "LOW" ? 0.0001 : priority === "NORMAL" ? 0.0002 : 0.0005;
    return Math.round(amount * baseRate * 100) / 100;
  };

  const handleRebalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId) {
      toast.error("Please select both source and destination nodes.");
      return;
    }
    if (sourceId === destId) {
      toast.error("Source and destination nodes must be different.");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid transfer amount.");
      return;
    }
    if (sourceNode && sourceNode.liquidity < amount) {
      toast.error(`Insufficient liquidity in ${sourceNode.name}.`);
      return;
    }
    if (!isCurrencyMatch) {
      toast.error("Inter-currency bridge requires gateway route approval.");
      return;
    }

    setLoading(true);
    toast.loading("Initiating secure inter-node transfer...", { id: "transfer" });

    // Simulate transfer network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update Nodes Liquidity
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === sourceId) {
          return { ...node, liquidity: node.liquidity - amount };
        }
        if (node.id === destId) {
          return { ...node, liquidity: node.liquidity + amount };
        }
        return node;
      })
    );

    // Add to ledger
    const newTx: LedgerItem = {
      id: `tx-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      source: sourceNode!.name,
      destination: destNode!.name,
      amount,
      currency: sourceNode!.currency,
      fee: calculateFee(),
      priority,
      status: "SUCCESS",
      txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
    };

    setLedger(prev => [newTx, ...prev]);
    setAmountStr("");
    setLoading(false);
    toast.success("Liquidity successfully rebalanced!", { id: "transfer" });
  };

  const formatVal = (val: number, currency: string) => {
    if (currency === "DZD") return `${val.toLocaleString()} DZD`;
    return `€${val.toLocaleString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">Treasury Rebalancing</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            Distribute and adjust liquidity across nodes, monitor pool capacities, and secure inter-node cash flows.
          </p>
        </div>
        <button 
          onClick={() => {
            setNodes(INITIAL_NODES);
            setLedger(INITIAL_LEDGER);
            toast.success("Node pools synchronized!");
          }}
          className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold shadow-2xs transition-all h-9 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Pools
        </button>
      </div>

      {/* Nodes Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const capacityPercent = Math.min(100, Math.round((node.liquidity / node.targetCapacity) * 100));
          const isCritical = capacityPercent < 40;
          const isOverloaded = capacityPercent > 95;

          return (
            <div 
              key={node.id} 
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-all duration-300 flex flex-col justify-between min-h-[190px] relative overflow-hidden group"
            >
              {/* Dynamic Status Glow */}
              <span className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                isCritical 
                  ? "from-rose-500 to-rose-400" 
                  : isOverloaded 
                  ? "from-amber-500 to-amber-400" 
                  : "from-[#C9A96E] to-[#A88244]"
              }`} />

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{node.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{node.location}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-3xs border ${
                    node.status === "ACTIVE" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" 
                      : "bg-amber-50 text-amber-700 border-amber-100/50 animate-pulse"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${node.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`} />
                    {node.status}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mt-2">
                  <h3 className="font-display text-xl sm:text-2xl text-slate-950 font-black font-mono leading-none tracking-tight">
                    {node.liquidity.toLocaleString()}
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{node.currency}</span>
                </div>

                {/* Progress bar to target */}
                <div className="space-y-1 mt-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Pool Capacity</span>
                    <span className={isCritical ? "text-rose-600 font-extrabold" : isOverloaded ? "text-amber-600 font-extrabold" : "text-slate-600"}>
                      {capacityPercent}% ({formatVal(node.targetCapacity, node.currency)} Target)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical 
                          ? "bg-gradient-to-r from-rose-500 to-rose-400" 
                          : isOverloaded 
                          ? "bg-gradient-to-r from-amber-500 to-amber-400" 
                          : "bg-gradient-to-r from-[#C9A96E] to-[#A88244]"
                      }`}
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card micro details footer */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-4 text-[9.5px] font-semibold text-slate-400">
                <span className="font-mono">{node.ipAddress}</span>
                <span>Sync: {node.lastSync}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Form & Flow Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rebalancing Form (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
            <h2 className="font-display text-sm font-bold text-slate-900">Initiate Secure Inter-Node Rebalancing</h2>
          </div>
          
          <form onSubmit={handleRebalance} className="p-6 space-y-6">
            
            {/* Source & Destination selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Source Node */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-slate-400" /> Source Pool Node
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-slate-800 transition-all font-semibold h-10"
                >
                  <option value="">Select source node...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({formatVal(n.liquidity, n.currency)} available)
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Node */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-slate-400" /> Destination Pool Node
                </label>
                <select
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-slate-800 transition-all font-semibold h-10"
                >
                  <option value="">Select destination node...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({formatVal(n.liquidity, n.currency)} capacity)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency bridging warning */}
            {sourceId && destId && !isCurrencyMatch && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs font-medium space-y-1">
                  <p className="font-bold">Inter-Currency Vault Lock Detected</p>
                  <p className="leading-relaxed text-[11px] text-rose-700">
                    Source currency ({sourceNode?.currency}) does not match destination currency ({destNode?.currency}). 
                    Direct pool rebalancing is only permitted inside the same currency zone. Inter-currency bridges require a multi-sig clearing gateway.
                  </p>
                </div>
              </div>
            )}

            {/* Amount & Priority Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Transfer Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-slate-400" /> Transfer Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="Enter liquidity amount..."
                    disabled={!sourceId}
                    className="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-2 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-slate-800 transition-all font-semibold h-10"
                  />
                  {sourceNode && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      {sourceNode.currency}
                    </span>
                  )}
                </div>
              </div>

              {/* Transfer Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" /> Node Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/80 p-0.5 rounded-xl h-10 items-center">
                  {(["LOW", "NORMAL", "HIGH"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`h-8 rounded-lg text-[10px] font-extrabold uppercase transition-all select-none ${
                        priority === p 
                          ? "bg-slate-900 text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/30"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated Impact Assessment */}
            {sourceId && destId && amount > 0 && isCurrencyMatch && (
              <div className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-4 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" /> Live Transaction Simulation Details
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium border-t border-slate-200/40 pt-3">
                  
                  {/* Source node future pool capacity */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Source After Impact</p>
                    <p className="font-bold text-slate-800 font-mono">{formatVal(sourceNode!.liquidity - amount, sourceNode!.currency)}</p>
                    <p className="text-[9.5px] text-rose-500 font-bold">
                      ({Math.round(((sourceNode!.liquidity - amount) / sourceNode!.targetCapacity) * 100)}% capacity)
                    </p>
                  </div>

                  {/* Destination future pool capacity */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Dest After Impact</p>
                    <p className="font-bold text-slate-800 font-mono">{formatVal(destNode!.liquidity + amount, destNode!.currency)}</p>
                    <p className="text-[9.5px] text-emerald-600 font-bold">
                      ({Math.round(((destNode!.liquidity + amount) / destNode!.targetCapacity) * 100)}% capacity)
                    </p>
                  </div>

                  {/* Gas & Fee estimate */}
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Gas & Service Fee</p>
                    <p className="font-bold text-slate-800 font-mono">
                      {formatVal(calculateFee(), sourceNode!.currency)}
                    </p>
                    <p className="text-[9.5px] text-slate-400 font-semibold">
                      ({priority === "LOW" ? "Est: 12-24 mins" : priority === "HIGH" ? "Est: Instant (2s)" : "Est: 3-5 mins"})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Extra settings & simulate toggles */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none font-bold">
                <input
                  type="checkbox"
                  checked={simulate}
                  onChange={(e) => setSimulate(e.target.checked)}
                  className="accent-slate-900 rounded"
                />
                <span className="flex items-center gap-1">
                  Simulation dry-run test mode <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !isCurrencyMatch || !sourceId || !destId || amount <= 0}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-sm transition-all h-10 disabled:opacity-40 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing Secure Rebalance...
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5" /> Rebalance Liquidity pool
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Transaction security check (1/3 width) */}
        <div className="space-y-6">
          
          {/* Security Compliance Card */}
          <div className="bg-[#0F0E0C] border border-zinc-900 rounded-3xl p-5 text-zinc-300 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Dynamic Gold Radial Glow background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A96E]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-xl text-[#C9A96E] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FAF9F6] tracking-wide">Multi-Node Trust Protocols</h3>
                  <p className="text-[10px] text-[#C9A96E]/70 font-extrabold uppercase mt-0.5 tracking-wider">Secured Node Tunneling</p>
                </div>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                Inter-node liquidity rebalancing is safeguarded by strict cryptographic routing channels. Transactions are committed inside a transactional sandbox ensuring zero-leakage ledger commits.
              </p>
            </div>

            <div className="border-t border-zinc-900 pt-4 mt-4 flex items-center justify-between text-[10px] font-bold text-zinc-500">
              <span className="flex items-center gap-1 text-[#C9A96E]"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> SSL / TLS Encrypted</span>
              <span>SHA-256 Verified</span>
            </div>
          </div>

          {/* Quick instructions list */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" /> Operator Instructions
            </h4>
            <ul className="text-xs text-slate-500 space-y-3 font-medium">
              <li className="flex gap-2.5">
                <span className="bg-slate-100 border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center font-bold text-slate-700 shrink-0">1</span>
                <span>Select a highly-loaded source pool and a low-liquidity destination pool.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="bg-slate-100 border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center font-bold text-slate-700 shrink-0">2</span>
                <span>Match node currencies (DZD-to-DZD or EUR-to-EUR) for standard pool rebalancing.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="bg-slate-100 border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center font-bold text-slate-700 shrink-0">3</span>
                <span>Adjust node priority: low priority reduces costs, high priority completes the transaction instantly.</span>
              </li>
            </ul>
          </div>
          
        </div>
      </div>

      {/* Recent Ledger Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-display text-sm font-bold text-slate-900">Recent Inter-Node Ledger Transactions</h2>
          <span className="text-[10px] bg-slate-100 border border-slate-200/50 text-slate-500 font-bold px-2 py-0.5 rounded-lg font-mono">
            TX Ledger: {ledger.length}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/20">
                {["Transaction ID", "Source Node", "Target Node", "Amount Transfer", "Priority", "Security Hash", "Timestamp", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {ledger.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors duration-150 group text-xs text-slate-600">
                  <td className="px-5 py-3.5 font-bold font-mono text-slate-800">{tx.id}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{tx.source}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{tx.destination}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-950 font-mono whitespace-nowrap">
                    {formatVal(tx.amount, tx.currency)} 
                    <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">
                      Fee: {formatVal(tx.fee, tx.currency)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-extrabold font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded ${
                      tx.priority === "HIGH" ? "bg-red-50 text-red-600 border border-red-100/50" : 
                      tx.priority === "LOW" ? "bg-slate-100 text-slate-600 border border-slate-200/50" :
                      "bg-blue-50 text-blue-600 border border-blue-100/50"
                    }`}>
                      {tx.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-400 font-semibold">{tx.txHash}</td>
                  <td className="px-5 py-3.5 text-slate-450 font-semibold whitespace-nowrap">{tx.timestamp}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 w-fit shadow-3xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Success
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
