import { Shield, Database, BarChart3, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import hiveLogo from "@/assets/hive-logo.svg";
import greoLogo from "@/assets/greo-logo.svg";
import ThemeToggle from "./ThemeToggle";

interface AppShellProps {
  currentTeller: number;
  onTellerChange: (teller: number) => void;
  children: ReactNode;
  username?: string;
  onLogout: () => void;
}

type Teller = {
  id: number;
  label: string;
  subtitle: string;
  icon?: typeof Shield;
  img?: string;
};

const AppShell = ({ currentTeller, onTellerChange, children, username, onLogout }: AppShellProps) => {
  const tellers: Teller[] = [
    { id: 1, label: "Teller 1", subtitle: "Authentication", icon: Shield },
    { id: 2, label: "Teller 2", subtitle: "Databases", icon: Database },
    { id: 3, label: "Teller 3", subtitle: "Reports", icon: BarChart3 },
    { id: 4, label: "Greo", subtitle: "AI Data Analyst", img: greoLogo },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col print-hide-shell">
      <header
        className="glass-panel-strong border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40 print-hide"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-md"
              style={{ background: "hsl(38 80% 58% / 0.2)", transform: "scale(1.3)" }}
            />
            <img src={hiveLogo} alt="HIVE" className="w-9 h-9 relative logo-adaptive" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-[0.18em] shimmer-text">HIVE</h1>
            <p className="text-[9px] tracking-[0.28em] uppercase -mt-0.5" style={{ color: "hsl(38 80% 58% / 0.8)" }}>
              Mass Data Storage
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1 glass-panel px-1.5 py-1.5">
          {tellers.filter((t) => username || t.id === 1).map((t) => {
            const Icon = t.icon;
            const isActive = currentTeller === t.id;
            const isGreo = t.id === 4;
            return (
              <button
                key={t.id}
                onClick={() => onTellerChange(t.id)}
                title={t.subtitle}
                className={isActive ? "teller-tab-active" : "teller-tab"}
                style={isGreo && isActive ? { borderColor: "#F9731640", background: "#F9731618" } : {}}
              >
                <span className="flex items-center gap-2">
                  {t.img ? (
                    <img
                      src={t.img}
                      alt={t.label}
                      className="w-3.5 h-3.5 object-contain rounded-full"
                      style={isGreo ? { filter: isActive ? "drop-shadow(0 0 4px #F97316)" : "none" } : {}}
                    />
                  ) : Icon ? (
                    <Icon size={14} />
                  ) : null}
                  <span className="hidden sm:inline" style={isGreo && isActive ? { color: "#F97316" } : {}}>
                    {t.label}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {username && (
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md"
                style={{ background: "hsl(38 80% 58% / 0.08)", border: "1px solid hsl(38 80% 58% / 0.18)" }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: "hsl(38 80% 58%)", color: "hsl(220 18% 6%)" }}
                >
                  {username[0].toUpperCase()}
                </div>
                <span className="text-xs font-medium text-foreground">{username}</span>
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="vault-button-secondary p-2 rounded-md text-muted-foreground hover:text-destructive"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default AppShell;
