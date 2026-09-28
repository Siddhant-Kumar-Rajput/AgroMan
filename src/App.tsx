import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowUp,
  Leaf,
  MapPin,
  Mic,
  Plus,
  ImagePlus,
  X,
  Volume2,
  Globe,
  ChevronDown,
  ShieldCheck,
  Radio,
  Download,
  Menu,
  Check,
  Loader2,
  Square,
  MessageCircle,
  LocateFixed,
  ExternalLink,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  clusterReports,
  districts,
  languages,
  MAX_TURNS,
  newThread,
  rotateThreads,
  turns,
  type Context,
  type Message,
  type Report,
  type Thread,
} from "../shared/domain";
import {
  advise,
  context,
  demo,
  demoReports,
  prepareImage,
  request,
  currentPosition,
} from "./lib/api";
import { readThreads, saveThreads } from "./lib/storage";
import { english, type Copy } from "./lib/i18n";
gsap.registerPlugin(ScrollTrigger, useGSAP);
type Page = "home" | "advisor" | "community" | "authority";
const photo =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85";
const speechLocales: Record<string, string> = {
  en: "en-IN",
  as: "as-IN",
  bn: "bn-IN",
  brx: "brx-IN",
  doi: "doi-IN",
  gu: "gu-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ks: "ks-IN",
  kok: "kok-IN",
  mai: "mai-IN",
  ml: "ml-IN",
  "mni-Mtei": "mni-IN",
  mr: "mr-IN",
  ne: "ne-NP",
  or: "or-IN",
  pa: "pa-IN",
  sa: "sa-IN",
  sat: "sat-IN",
  sd: "sd-IN",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-IN",
};
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [districtId, setDistrictId] = useState(() => {
    const stored = localStorage.getItem("agroman-district");
    return districts.some((d) => d.id === stored) ? stored! : "PB-LDH";
  });
  const [locale, setLocale] = useState(() => {
    const stored = localStorage.getItem("agroman-locale");
    return languages.some((l) => l[0] === stored) ? stored! : "en";
  });
  const [copy, setCopy] = useState<Copy>(english);
  const [languageBusy, setLanguageBusy] = useState(false);
  const [error, setError] = useState("");
  const [region, setRegion] = useState<Context>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<{ mime: "image/jpeg"; data: string }>();
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [consent, setConsent] = useState<Message>();
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [recording, setRecording] = useState(false);
  const [liveClusters, setLiveClusters] = useState<
    ReturnType<typeof clusterReports>
  >([]);
  const recorder = useRef<MediaRecorder | undefined>(undefined);
  const recordTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const voiceQuestion = useRef(false);
  const modalRef = useRef<HTMLElement>(null);
  const t = (key: keyof Copy) => copy[key];
  const district = districts.find((d) => d.id === districtId) ?? districts[0];
  const current = threads.find((thread) => thread.id === active);
  const clusters = demo ? clusterReports(reports) : liveClusters;
  const atLimit = current ? turns(current) >= MAX_TURNS : false;
  useEffect(() => {
    readThreads()
      .then((list) => {
        setThreads(list);
        setActive(list[0]?.id ?? "");
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
        setError(
          "Local storage is unavailable. Conversations may not be saved.",
        );
      });
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      clearTimeout(recordTimer.current);
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    if (loaded)
      saveThreads(threads).catch(() =>
        setError("Your browser could not save this conversation."),
      );
  }, [threads, loaded]);
  useEffect(() => {
    let cancelled = false;
    setRegion(undefined);
    localStorage.setItem("agroman-district", districtId);
    context(districtId)
      .then((value) => {
        if (!cancelled) setRegion(value);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    if (demo) setReports(demoReports(districtId));
    else
      request<{ clusters: ReturnType<typeof clusterReports> }>(
        `outbreaks/nearby?districtId=${encodeURIComponent(districtId)}`,
      )
        .then((value) => {
          if (!cancelled) setLiveClusters(value.clusters);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    return () => {
      cancelled = true;
    };
  }, [districtId]);
  useEffect(() => {
    let cancelled = false;
    localStorage.setItem("agroman-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = ["ur", "ks", "sd"].includes(locale)
      ? "rtl"
      : "ltr";
    setCopy(english);
    if (locale !== "en" && !demo) {
      setLanguageBusy(true);
      request<Copy>("translate/ui", { locale })
        .then((value) => {
          if (!cancelled) setCopy(value);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLanguageBusy(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [locale]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [current?.messages.length, busy]);
  useEffect(() => {
    if (!consent) return;
    const previous = document.activeElement as HTMLElement | null;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setConsent(undefined);
      if (event.key === "Tab") {
        const elements = modalRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [consent, busy]);
  useGSAP(
    () => {
      if (
        page !== "home" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      gsap.from(".hero-content > *", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power2.out",
      });
      gsap.fromTo(
        ".landscape",
        { scale: 0.92 },
        {
          scale: 1,
          scrollTrigger: {
            trigger: ".landscape",
            start: "top bottom",
            end: "center center",
            scrub: 1,
          },
        },
      );
      gsap.fromTo(
        ".principle span",
        { opacity: 0.25 },
        {
          opacity: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".principle",
            start: "top 85%",
            end: "bottom 65%",
            scrub: 1,
          },
        },
      );
    },
    { scope: root, dependencies: [page], revertOnUpdate: true },
  );
  function go(next: Page) {
    if (busy) return;
    setPage(next);
    setMenu(false);
    setError("");
    window.scrollTo(0, 0);
  }
  function startThread() {
    if (busy) return;
    if (threads.length === 3 && !window.confirm(t("rotation"))) return;
    const thread = newThread(districtId);
    setThreads((list) => rotateThreads(list, thread));
    setActive(thread.id);
    setInput("");
    setImage(undefined);
  }
  function changeDistrict(next: string) {
    if (busy) return;
    if (current?.messages.length && current.districtId !== next) {
      if (threads.length === 3 && !window.confirm(t("rotation"))) return;
      const thread = newThread(next);
      setThreads((list) => rotateThreads(list, thread));
      setActive(thread.id);
    } else if (current) {
      setThreads((list) =>
        list.map((thread) =>
          thread.id === current.id ? { ...thread, districtId: next } : thread,
        ),
      );
    }
    setDistrictId(next);
    setImage(undefined);
  }
  async function send(text = input) {
    if (!text.trim() && image) text = t("photoPrompt");
    if (busy || atLimit || !online || !text.trim() || !loaded) return;
    setError("");
    let thread = current;
    if (!thread) {
      thread = newThread(districtId);
      setThreads((list) => rotateThreads(list, thread!));
      setActive(thread.id);
    }
    const target = thread;
    const message: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: text.trim(),
    };
    setBusy(true);
    setThreads((list) =>
      list.map((item) =>
        item.id === target.id
          ? {
              ...item,
              title: target.messages.length ? item.title : text.slice(0, 38),
              messages: [...item.messages, message],
            }
          : item,
      ),
    );
    setInput("");
    try {
      const answer = await advise({
        requestId: crypto.randomUUID(),
        threadId: target.id,
        districtId: target.districtId,
        locale,
        text: message.text,
        history: target.messages.map(({ role, text }) => ({ role, text })),
        image,
      });
      setImage(undefined);
      setThreads((list) =>
        list.map((item) =>
          item.id === target.id
            ? {
                ...item,
                messages: [
                  ...item.messages,
                  { id: crypto.randomUUID(), role: "assistant", ...answer },
                ],
              }
            : item,
        ),
      );
      if (voiceQuestion.current) {
        voiceQuestion.current = false;
        void speak(answer.text);
      }
    } catch (e) {
      setError((e as Error).message);
      setInput(text);
      setThreads((list) =>
        list.map((item) =>
          item.id === target.id
            ? {
                ...item,
                messages: item.messages.filter((m) => m.id !== message.id),
              }
            : item,
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  async function attach(file?: File) {
    if (!file) return;
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setError((e as Error).message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setError(t("voiceUnavailable"));
      return;
    }
    const language = speechLocales[locale] ?? locale;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (candidate) =>
        candidate.lang.toLowerCase() === language.toLowerCase() ||
        candidate.lang.toLowerCase().startsWith(`${locale.toLowerCase()}-`),
    );
    if (voices.length && !voice) {
      setError(t("voiceUnavailable"));
      return;
    }
    if (voice) utterance.voice = voice;
    utterance.onerror = () => setError(t("voiceUnavailable"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
  async function record() {
    if (demo) {
      setError(t("voiceUnavailable"));
      return;
    }
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      recorder.current = media;
      const chunks: BlobPart[] = [];
      media.ondataavailable = (e) => chunks.push(e.data);
      media.onstop = async () => {
        clearTimeout(recordTimer.current);
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        try {
          const blob = new Blob(chunks, { type: media.mimeType });
          if (blob.size > 1500000)
            throw new Error(
              "Recording too large. Please record a shorter question.",
            );
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let data = "";
          for (const byte of bytes) data += String.fromCharCode(byte);
          const value = await request<{ text: string }>("speech/transcribe", {
            data: btoa(data),
            mime: media.mimeType,
            locale,
          });
          setInput(value.text);
          voiceQuestion.current = true;
        } catch (e) {
          setError((e as Error).message);
        }
      };
      media.start();
      setRecording(true);
      recordTimer.current = setTimeout(() => {
        if (media.state === "recording") media.stop();
      }, 45000);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function contribute() {
    if (!consent?.diagnosis) return;
    setBusy(true);
    try {
      if (demo) {
        setReports((list) => [
          ...list,
          {
            id: consent.id,
            installation: "local-demo-device",
            districtId: current?.districtId ?? districtId,
            crop: consent.diagnosis!.crop,
            diseaseCode: consent.diagnosis!.diseaseCode,
            name: consent.diagnosis!.name,
            confidence: consent.diagnosis!.confidence,
            lat: district.lat,
            lon: district.lon,
            timestamp: Date.now(),
            origin: "demo",
          },
        ]);
      } else {
        await request("reports/contribute", {
          receipt: consent.receipt,
          consent: true,
          position: await currentPosition(),
        });
        const result = await request<{
          clusters: ReturnType<typeof clusterReports>;
        }>(`outbreaks/nearby?districtId=${districtId}`);
        setLiveClusters(result.clusters);
      }
      setThreads((list) =>
        list.map((thread) => ({
          ...thread,
          messages: thread.messages.map((m) =>
            m.id === consent.id ? { ...m, contributed: true } : m,
          ),
        })),
      );
      setConsent(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function locate() {
    try {
      const position = await currentPosition();
      if (demo) {
        setError(
          "Location received. Choose a sample district below; demonstration mode does not resolve real boundaries.",
        );
        return;
      }
      const result = await request<{ districtId: string }>(
        "location/resolve",
        position,
      );
      changeDistrict(result.districtId);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function download() {
    const content = JSON.stringify(
      {
        notice:
          "Unverified potential disease signals. Not confirmed outbreaks.",
        origin: demo ? "synthetic demonstration" : "live",
        exportedAt: new Date().toISOString(),
        clusters,
      },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "agroman-incidents.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const locationSelector = (
    <div className="location-select">
      <MapPin size={17} />
      <select
        aria-label={t("district")}
        value={districtId}
        disabled={busy}
        onChange={(e) => changeDistrict(e.target.value)}
      >
        {["Punjab", "Uttar Pradesh", "Maharashtra"].map((state) => (
          <optgroup key={state} label={state}>
            {districts
              .filter((d) => d.state === state)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}, {state}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown size={14} />
    </div>
  );
  return (
    <div ref={root} className="app">
      <a href="#content" className="skip">
        {t("skip")}
      </a>
      <header className="nav">
        <button
          className="brand"
          onClick={() => go("home")}
          aria-label="AgroMan home"
        >
          <img src="/mark.svg" alt="" />
          <span>
            agroman<span className="brand-dot">.</span>
          </span>
        </button>
        <nav
          className={menu ? "nav-links open" : "nav-links"}
          aria-label={t("navigation")}
        >
          {(["home", "advisor", "community"] as Page[]).map((item) => (
            <button
              key={item}
              className={page === item ? "selected" : ""}
              onClick={() => go(item)}
            >
              {t(item)}
            </button>
          ))}
        </nav>
        <div className="nav-tools">
          <label className="language">
            <Globe size={16} />
            <select
              aria-label={t("language")}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {languages.map(([code, name]) => (
                <option value={code} key={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="mobile-menu icon-button"
            aria-label={t("menu")}
            onClick={() => setMenu(!menu)}
          >
            <Menu />
          </button>
          <button className="nav-cta" onClick={() => go("advisor")}>
            {t("openAdvisor")}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </header>
      <div className="mode-strip">
        <span className="status-dot" />
        {demo ? t("demo") : t("live")}
        <span className="mode-detail">
          {demo ? t("demoNote") : t("privacy")}
        </span>
      </div>
      {!online && (
        <div className="notice" role="status">
          {t("offline")}
        </div>
      )}
      {locale !== "en" && demo && (
        <div className="notice" role="status">
          {t("translationPending")}
        </div>
      )}
      {languageBusy && <div className="notice">{t("languageBusy")}</div>}
      {error && (
        <div className="error" role="alert">
          {error}
          <button aria-label={t("dismiss")} onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}
      <main id="content">
        {page === "home" ? (
          <>
            <section className="hero">
              <div className="hero-content">
                <p className="eyebrow">
                  <span /> {t("brandLine")}
                </p>
                <h1>
                  {t("heroLead")}
                  <br />
                  <em>{t("heroEnd")}</em>
                </h1>
                <p className="hero-copy">{t("heroCopy")}</p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => go("advisor")}>
                    {t("start")}
                    <ArrowUpRight size={19} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => go("community")}
                  >
                    {t("explore")}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
              <div className="landscape">
                <img
                  src={photo}
                  alt="Green cultivated countryside in evening light"
                />
                <div className="landscape-caption">
                  <span>
                    {t("landscapeLead")}
                    <br />
                    {t("landscapeEnd")}
                  </span>
                  <span className="landscape-coordinate">
                    30.9010° N<br />
                    75.8573° E
                  </span>
                </div>
              </div>
              <div className="region-bar">
                <div>
                  <MapPin size={20} />
                  <div>
                    <small>{t("location")}</small>
                    <strong>
                      {district.name}, {district.state}
                    </strong>
                  </div>
                </div>
                {locationSelector}
                <button className="text-button" onClick={() => void locate()}>
                  <LocateFixed size={16} />
                  {t("locate")}
                </button>
              </div>
            </section>
            <section className="features section">
              <div className="section-heading">
                <p className="eyebrow">{t("personal")}</p>
                <h2>
                  {t("fieldHeadline")}
                  <br />
                  <em>{t("futureHeadline")}</em>
                </h2>
              </div>
              <div className="feature-grid">
                {[
                  {
                    icon: Leaf,
                    title: "grounded",
                    body: "groundedCopy",
                    to: "advisor",
                    number: "01",
                  },
                  {
                    icon: MessageCircle,
                    title: "care",
                    body: "careCopy",
                    to: "advisor",
                    number: "02",
                  },
                  {
                    icon: Radio,
                    title: "together",
                    body: "togetherCopy",
                    to: "community",
                    number: "03",
                  },
                ].map(({ icon: Icon, title, body, to, number }) => (
                  <button
                    className="feature"
                    key={title}
                    onClick={() => go(to as Page)}
                  >
                    <div className="feature-top">
                      <Icon size={27} />
                      <ArrowUpRight size={22} />
                    </div>
                    <span className="feature-number">{number}</span>
                    <h3>{t(title as keyof Copy)}</h3>
                    <p>{t(body as keyof Copy)}</p>
                  </button>
                ))}
              </div>
            </section>
            <section className="principle section">
              <div className="leaf-art">
                <Leaf size={80} strokeWidth={0.8} />
              </div>
              <h2>
                {t("principle")
                  .split(" ")
                  .map((word, i) => (
                    <span key={i}>{word} </span>
                  ))}
              </h2>
              <p>{t("principleCopy")}</p>
              <div className="source-line">{t("sources")}</div>
            </section>
            <section className="final-cta">
              <h2>{t("cta")}</h2>
              <button className="primary light" onClick={() => go("advisor")}>
                {t("start")}
                <ArrowUpRight size={20} />
              </button>
            </section>
          </>
        ) : page === "advisor" ? (
          <section className="workspace">
            <aside className="sidebar">
              <p className="eyebrow">{t("conversations")}</p>
              <button
                className="new-chat"
                onClick={startThread}
                disabled={busy || !loaded}
              >
                <Plus size={17} />
                {t("newChat")}
              </button>
              <div className="thread-list">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    disabled={busy}
                    className={
                      active === thread.id ? "thread active" : "thread"
                    }
                    onClick={() => {
                      setActive(thread.id);
                      setDistrictId(thread.districtId);
                    }}
                  >
                    <MessageCircle size={16} />
                    <span>
                      {thread.title}
                      <small>
                        {turns(thread)} / {MAX_TURNS} {t("questions")}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              <p className="local-note">
                <ShieldCheck size={14} />
                {t("localOnly")}
              </p>
              <div className="context-card">
                <div className="context-heading">
                  <Leaf size={19} />
                  {t("dataLabel")}
                </div>
                {locationSelector}
                <div className="metrics">
                  <div>
                    <small>{t("ph")}</small>
                    <strong>{region?.soilPh ?? "—"}</strong>
                  </div>
                  <div>
                    <small>{t("rain")}</small>
                    <strong>
                      {region?.rainfallMm ?? "—"}
                      <i> mm</i>
                    </strong>
                  </div>
                </div>
                <p>{t("estimate")}</p>
                <small>
                  {t("date")}: {region?.observedAt ?? "—"}
                </small>
                <small>{region?.source ?? t("unavailable")}</small>
              </div>
            </aside>
            <div className="chat">
              {clusters.some((c) => c.status === "potential") && (
                <button
                  className="nearby-alert"
                  onClick={() => go("community")}
                >
                  <Radio size={15} />
                  {t("alert")}
                  <ArrowUpRight size={15} />
                </button>
              )}
              <div className="chat-heading">
                <div>
                  <p className="eyebrow">
                    {district.name} · {district.state}
                  </p>
                  <h2>{t("chatTitle")}</h2>
                  <p>{t("chatDescription")}</p>
                </div>
                <span className="chat-leaf">
                  <Leaf size={25} />
                </span>
              </div>
              <div className="messages" aria-live="polite">
                {!current?.messages.length && (
                  <div className="empty-chat">
                    <div className="empty-symbol">
                      <Leaf size={38} strokeWidth={1.2} />
                    </div>
                    <h3>{t("empty")}</h3>
                    <div className="suggestions">
                      {(["prompt1", "prompt2", "prompt3"] as const).map(
                        (key) => (
                          <button
                            key={key}
                            disabled={busy}
                            onClick={() => send(t(key))}
                          >
                            {t(key)}
                            <ArrowUpRight size={16} />
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {current?.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`message ${message.role}`}
                  >
                    <div className="message-label">
                      {message.role === "assistant" ? (
                        <>
                          <Leaf size={15} /> AgroMan
                        </>
                      ) : (
                        t("you")
                      )}
                    </div>
                    <div className="message-body">{message.text}</div>
                    {message.diagnosis && (
                      <div className="diagnosis">
                        <strong>{message.diagnosis.name}</strong>
                        <span>
                          {t("confidence")}:{" "}
                          {Math.round(message.diagnosis.confidence * 100)}%
                        </span>
                        <small>{t("notDiagnosis")}</small>
                        {message.diagnosis.confidence >= 0.75 && (
                          <button
                            className="text-button"
                            disabled={message.contributed || busy}
                            onClick={() => setConsent(message)}
                          >
                            {message.contributed ? (
                              <Check size={16} />
                            ) : (
                              <Plus size={16} />
                            )}{" "}
                            {message.contributed
                              ? t("contributed")
                              : t("report")}
                          </button>
                        )}
                      </div>
                    )}
                    {message.role === "assistant" && (
                      <button
                        className="audio-button"
                        onClick={() => speak(message.text)}
                      >
                        <Volume2 size={15} />
                        {t("listen")}
                      </button>
                    )}
                  </article>
                ))}
                {busy && (
                  <div className="working">
                    <Loader2 className="spin" size={18} />
                    {t("working")}
                  </div>
                )}
                <div ref={end} />
              </div>
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                {image && (
                  <div className="attachment">
                    <img
                      src={`data:${image.mime};base64,${image.data}`}
                      alt={t("selectedPlant")}
                    />
                    <span>{t("photoNotice")}</span>
                    <button
                      type="button"
                      aria-label={t("removeImage")}
                      onClick={() => setImage(undefined)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <textarea
                  aria-label={t("placeholder")}
                  placeholder={atLimit ? t("quota") : t("placeholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy || atLimit}
                  maxLength={3000}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <div className="composer-tools">
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => void attach(e.target.files?.[0])}
                      hidden
                    />
                    <button
                      className="icon-button"
                      type="button"
                      disabled={busy || atLimit}
                      aria-label={t("attach")}
                      onClick={() => fileRef.current?.click()}
                    >
                      <ImagePlus size={20} />
                    </button>
                    <button
                      className={`icon-button ${recording ? "recording" : ""}`}
                      type="button"
                      disabled={busy || atLimit}
                      aria-label={recording ? t("stop") : t("record")}
                      onClick={() => void record()}
                    >
                      {recording ? <Square size={18} /> : <Mic size={20} />}
                    </button>
                  </div>
                  <span>
                    {current ? turns(current) : 0}/{MAX_TURNS}
                  </span>
                  <button
                    className="send"
                    type="submit"
                    aria-label={t("send")}
                    disabled={
                      busy || atLimit || (!input.trim() && !image) || !online
                    }
                  >
                    <ArrowUp size={21} />
                  </button>
                </div>
              </form>
              <p className="chat-footnote">
                {t("threadLocation")} {t("privacy")}
              </p>
            </div>
          </section>
        ) : (
          <section className="watch-page section">
            <div className="watch-heading">
              <div>
                <p className="eyebrow">
                  <Radio size={14} /> {t("community")}
                </p>
                <h1>
                  {page === "authority" ? t("authorityTitle") : t("watchTitle")}
                </h1>
                <p>
                  {page === "authority" ? t("authorityCopy") : t("watchCopy")}
                </p>
              </div>
              {page === "authority" ? (
                <button className="primary" onClick={download}>
                  <Download size={17} />
                  {t("download")}
                </button>
              ) : (
                <button className="secondary" onClick={() => go("authority")}>
                  {t("authority")}
                  <ArrowUpRight size={17} />
                </button>
              )}
            </div>
            <div className="watch-toolbar">
              {locationSelector}
              <span>{t("window")}</span>
            </div>
            {demo && (
              <div className="demo-banner">
                <ShieldCheck size={17} />
                {t("synthetic")} — {t("reportNotice")}
              </div>
            )}
            <div className="watch-grid">
              <div
                className="district-map"
                role="img"
                aria-label={`Schematic observation area for ${district.name}; not a geographic basemap`}
              >
                <div className="map-grid" />
                <div className="river" />
                <div className="map-road road-one" />
                <div className="map-road road-two" />
                <div className="map-label">
                  {district.name}
                  <small>{district.state}</small>
                </div>
                {clusters.map((cluster, i) => (
                  <div
                    className="map-marker"
                    key={cluster.id}
                    style={{ left: `${45 + i * 12}%`, top: `${45 + i * 8}%` }}
                  >
                    <span>{cluster.count}</span>
                    <small>{cluster.name}</small>
                  </div>
                ))}
                <span className="map-caption">{t("schematic")}</span>
              </div>
              <div className="incident-list">
                {!clusters.length ? (
                  <p>{t("noReports")}</p>
                ) : (
                  clusters.map((cluster) => (
                    <article className="incident" key={cluster.id}>
                      <span className={`incident-status ${cluster.status}`}>
                        <span />
                        {t(cluster.status)}
                      </span>
                      <h3>{cluster.name}</h3>
                      <p>
                        <MapPin size={14} />
                        {
                          districts.find((d) => d.id === cluster.districtId)
                            ?.name
                        }
                      </p>
                      <div className="incident-count">
                        <strong>{cluster.count}</strong>
                        <span>{t("reports")}</span>
                      </div>
                      <small>{t("reportNotice")}</small>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <footer>
        <button className="brand" onClick={() => go("home")}>
          <img src="/mark.svg" alt="" />
          <span>agroman.</span>
        </button>
        <p>{t("footer")}</p>
        <a
          href="https://github.com/Siddhant-Kumar-Rajput/AgroMan"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <ExternalLink size={13} />
        </a>
        <span>PHASE 1 / 2026</span>
      </footer>
      {consent && (
        <div
          className="modal-backdrop"
          onClick={() => !busy && setConsent(undefined)}
        >
          <section
            className="modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
            onClick={(e) => e.stopPropagation()}
          >
            <ShieldCheck size={30} />
            <h2 id="consent-title">{t("report")}</h2>
            <p>{t("consent")}</p>
            {demo && <p className="demo-banner">{t("synthetic")}</p>}
            <div className="modal-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setConsent(undefined)}
              >
                {t("cancel")}
              </button>
              <button
                className="primary"
                autoFocus
                disabled={busy}
                onClick={() => void contribute()}
              >
                {t("share")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
