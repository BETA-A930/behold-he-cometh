import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import AppShell from "@/components/AppShell";
import TellerOne from "@/components/TellerOne";
import TellerTwo from "@/components/TellerTwo";
import TellerThree from "@/components/TellerThree";
import TellerFour from "@/components/TellerFour";
import { api, VaultDatabase } from "@/lib/api";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTeller, setCurrentTeller] = useState(1);
  const [username, setUsername] = useState("");
  const [isInstitution, setIsInstitution] = useState(false);
  const [institutionType, setInstitutionType] = useState<string | undefined>();
  const [reportDb, setReportDb] = useState<VaultDatabase | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    api.auth.me()
      .then((data) => {
        setUsername(data.username);
        setIsInstitution(data.isInstitution);
        setInstitutionType(data.institutionType ?? undefined);
        setCurrentTeller((t) => (t === 1 ? 2 : t));
      })
      .catch(() => {});
  }, []);

  const handleAuthenticated = (user: string, instFlag: boolean, instType?: string) => {
    setUsername(user);
    setIsInstitution(instFlag);
    setInstitutionType(instType);
    setCurrentTeller(2);
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUsername("");
    setIsInstitution(false);
    setInstitutionType(undefined);
    setCurrentTeller(1);
    setReportDb(null);
  };

  const handleViewReports = (db: VaultDatabase) => {
    setReportDb(db);
    setCurrentTeller(3);
  };

  return (
    <>
      <SplashScreen visible={showSplash} />
      {!showSplash && (
        <AppShell currentTeller={currentTeller} onTellerChange={setCurrentTeller} username={username} onLogout={handleLogout}>
          {currentTeller === 1 && <TellerOne onAuthenticated={handleAuthenticated} />}
          {currentTeller === 2 && <TellerTwo institutionType={institutionType} username={username} onViewReports={handleViewReports} />}
          {currentTeller === 3 && <TellerThree database={reportDb} onBack={() => setCurrentTeller(2)} />}
          {currentTeller === 4 && <TellerFour username={username} onLogout={handleLogout} />}
        </AppShell>
      )}
    </>
  );
};

export default Index;
