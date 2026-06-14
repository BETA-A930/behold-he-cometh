import { motion, AnimatePresence } from "framer-motion";
import hiveLogo from "@/assets/hive-logo.svg";

interface SplashScreenProps {
  visible: boolean;
}

const SplashScreen = ({ visible }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
              style={{ background: "radial-gradient(circle, hsl(38 80% 52% / 0.07) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, hsl(38 80% 52% / 0.05) 0%, transparent 60%)" }}
              animate={{ scale: [1.05, 1, 1.05] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              className="w-[280px] h-[280px] rounded-full border border-primary/8"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
            />
            <motion.div
              className="w-[360px] h-[360px] rounded-full"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                border: "1px dashed hsl(38 80% 52% / 0.12)",
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="w-[460px] h-[460px] rounded-full border border-primary/5"
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              style={{ position: "absolute", top: "50%", left: "50%", width: 360, height: 360, marginTop: -180, marginLeft: -180 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "hsl(38 80% 52% / 0.6)",
                  boxShadow: "0 0 8px hsl(38 80% 52% / 0.8)",
                }}
              />
            </motion.div>
          </div>
          <motion.div
            className="relative flex flex-col items-center gap-6 z-10"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
              <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: "hsl(38 80% 52% / 0.18)", transform: "scale(1.5)" }} />
              <img src={hiveLogo} alt="HIVE" className="w-28 h-28 relative drop-shadow-2xl" />
            </motion.div>
            <motion.div className="text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }}>
              <div className="flex items-center justify-center gap-[0.12em] mb-1">
                {"HIVE".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    className="text-5xl font-black tracking-tight"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(38 90% 32%), hsl(38 70% 52%), hsl(38 90% 26%), hsl(38 60% 46%))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 + i * 0.07, duration: 0.4 }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
              <motion.div
                className="mx-auto h-px mb-2.5"
                style={{ background: "linear-gradient(90deg, transparent, hsl(38 80% 52% / 0.7), transparent)" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.1, duration: 0.6, ease: "easeOut" }}
              />
              <motion.p className="text-xs tracking-[0.42em] uppercase" style={{ color: "hsl(38 80% 62%)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }}>
                Mass Data Storage
              </motion.p>
            </motion.div>
            <motion.div className="flex gap-2 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.4 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "hsl(38 80% 52% / 0.7)" }}
                  animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
